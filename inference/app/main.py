# inference/app/main.py
import os
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch.nn.functional as F

ROOT = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(ROOT, "model")
TOKENIZER_PATH = os.path.join(ROOT, "tokenizer")

app = FastAPI(title="RoBERTa Sentiment Inference (text)")

nlp_model = None
tokenizer = None
id2label = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class BatchReq(BaseModel):
    texts: list[str]

@app.on_event("startup")
def load():
    global nlp_model, tokenizer, id2label
    print("Device:", device)
    tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_PATH, local_files_only=True)
    nlp_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH, local_files_only=True)
    nlp_model.to(device)
    cfg = nlp_model.config
    print("Model config num_labels:", getattr(cfg, "num_labels", None))
    print("Model config id2label:", getattr(cfg, "id2label", None))

    # If the model config has generic labels like LABEL_0, override to human labels:
    raw_id2label = getattr(cfg, "id2label", None)
    if raw_id2label and all(str(v).startswith("LABEL_") for v in raw_id2label.values()):
        # Observed mapping from your tests: 0 -> POSITIVE, 1 -> NEUTRAL, 2 -> NEGATIVE
        id2label = {str(0): "POSITIVE", str(1): "NEUTRAL", str(2): "NEGATIVE"}
        print("Overriding id2label to (observed):", id2label)

    elif raw_id2label:
        # keep model-provided mapping (ensure keys are str)
        id2label = {str(k): v for k, v in raw_id2label.items()}
    else:
        # fallback default labels
        num_labels = getattr(cfg, "num_labels", 2) or 2
        id2label = {str(i): f"LABEL_{i}" for i in range(num_labels)}
        print("Using fallback id2label:", id2label)

@app.post("/predict")
async def predict(req: BatchReq):
    global nlp_model, tokenizer, id2label
    if nlp_model is None:
        raise HTTPException(status_code=503, detail="model not loaded")
    texts = req.texts
    if not texts:
        raise HTTPException(status_code=400, detail="no texts provided")
    enc = tokenizer(texts, return_tensors="pt", padding=True, truncation=True).to(device)
    with torch.no_grad():
        outputs = nlp_model(**enc)
        logits = outputs.logits.cpu()
        probs = F.softmax(logits, dim=-1).numpy().tolist()
        preds = logits.argmax(dim=-1).cpu().numpy().tolist()

    results = []
    for i, t in enumerate(texts):
        lid = str(int(preds[i]))
        results.append({
            "text": t,
            "pred_id": int(preds[i]),
            "label": id2label.get(lid, f"LABEL_{lid}"),
            "probs": probs[i],   # list of probabilities per class in order [class0, class1, ...]
            "logits": logits[i].tolist()
        })
    return {"results": results}
