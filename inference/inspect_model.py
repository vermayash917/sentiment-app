# inference/inspect_model.py
import json, os
from transformers import AutoConfig

ROOT = os.path.dirname(__file__)
MODEL_PATH = os.path.join(ROOT, "model")

cfg = AutoConfig.from_pretrained(MODEL_PATH, local_files_only=True)
print("num_labels:", getattr(cfg, "num_labels", None))
print("id2label:", getattr(cfg, "id2label", None))
print("label2id:", getattr(cfg, "label2id", None))
print("config keys:", list(cfg.to_dict().keys()))
