import json
import spacy
import joblib
import numpy as np
from sklearn.preprocessing import LabelEncoder
import os

# Load spaCy model
nlp = spacy.load("en_core_web_md")

# Load intents
with open("intents.json", "r", encoding="utf-8") as file:
    data = json.load(file)

patterns = []
tags = []
pattern_tags = []   # FIXED: previously missing

# Extract patterns and tags
for intent in data["intents"]:
    for p in intent["patterns"]:
        patterns.append(p)
        tags.append(intent["tag"])
        pattern_tags.append(intent["tag"])

# Encode all TAGS
label_encoder = LabelEncoder()
encoded_labels = label_encoder.fit_transform(tags)

# Convert patterns into embeddings
vectors = []
for text in patterns:
    vectors.append(nlp(text).vector)

vectors = np.array(vectors)

# Save directory
os.makedirs("embeddings_model", exist_ok=True)

# SAVE EVERYTHING CORRECTLY
joblib.dump(vectors, "embeddings_model/pattern_vectors.pkl")
joblib.dump(label_encoder, "embeddings_model/labels.pkl")
joblib.dump(patterns, "embeddings_model/vocab.pkl")
joblib.dump(pattern_tags, "embeddings_model/pattern_tags.pkl")

print("✔ Embeddings saved successfully!")
print("Saved:", len(vectors), "pattern vectors")
