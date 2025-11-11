# inference/test_text_model_verbose.py
import os, torch, numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch.nn.functional as F

ROOT = os.path.dirname(__file__)
MODEL_PATH = os.path.join(ROOT, "model")         # contains config.json and pytorch_model.bin
TOKENIZER_PATH = os.path.join(ROOT, "tokenizer") # your tokenizer folder

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# load tokenizer & model from local dirs
tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_PATH, local_files_only=True)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH, local_files_only=True)
model.to(device)
model.eval()

# inspect config mapping
cfg = model.config
print("num_labels:", cfg.num_labels)
print("raw id2label in config:", getattr(cfg, "id2label", None))
# if id2label is missing, create a default mapping:
if not getattr(cfg, "id2label", None):
    # Change names if you know them (e.g., ["NEGATIVE","NEUTRAL","POSITIVE"]).
    # Here we create human-friendly names automatically:
    id2label = {str(i): f"LABEL_{i}" for i in range(cfg.num_labels)}
else:
    id2label = cfg.id2label

print("Using id2label mapping:", id2label)

def predict_texts(texts):
    enc = tokenizer(texts, return_tensors="pt", padding=True, truncation=True).to(device)
    with torch.no_grad():
        outputs = model(**enc)
        # outputs.logits shape (batch,num_labels)
        logits = outputs.logits.cpu()
        probs = F.softmax(logits, dim=-1).numpy()
        preds = probs.argmax(axis=-1)
    results = []
    for i, text in enumerate(texts):
        label_id = str(int(preds[i]))
        label = id2label.get(label_id, f"LABEL_{label_id}")
        results.append({
            "text": text,
            "logits": logits[i].tolist(),
            "probs": probs[i].tolist(),
            "pred_id": int(preds[i]),
            "label": label
        })
    return results

# Example tests
tests = ["I absolutely love this!", "This product is terrible and broke.", "It was okay, nothing special."]
out = predict_texts(tests)
import json
print(json.dumps(out, indent=2))
