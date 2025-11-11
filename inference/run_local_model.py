# run_local_model.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch, os

ROOT = os.path.dirname(__file__)
MODEL_PATH = os.path.join(ROOT, "model")
TOKENIZER_PATH = os.path.join(ROOT, "tokenizer")

print("torch version:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())

tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_PATH, local_files_only=True)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH, local_files_only=True)
pipe = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer, device=0 if torch.cuda.is_available() else -1)

texts = ["I love this!", "This is awful.", "It was okay, not great."]
print(pipe(texts))
