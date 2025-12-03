from flask import Flask, request, jsonify, render_template, session
from flask_session import Session
import json
import joblib
import numpy as np
import spacy

# Load NLP model
nlp = spacy.load("en_core_web_md")

# Load embedding data
pattern_vectors = joblib.load("embeddings_model/pattern_vectors.pkl")
pattern_tags = joblib.load("embeddings_model/pattern_tags.pkl")
patterns = joblib.load("embeddings_model/vocab.pkl")

# Load intents
with open("intents.json", "r", encoding="utf-8") as f:
    intents = json.load(f)

app = Flask(__name__)
app.secret_key = "supersecret"
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# -------- Conversation Memory --------
MEMORY_LIMIT = 6

def get_memory():
    return session.get("memory", [])

def save_memory(memory):
    session["memory"] = memory[-MEMORY_LIMIT:]

def add_to_memory(role, text):
    memory = get_memory()
    memory.append({"role": role, "text": text})
    save_memory(memory)

def build_context_prompt(user_msg):
    memory = get_memory()

    if len(memory) >= 1:
        last_topic = memory[-1]["text"]
        return f"{last_topic} → {user_msg}"

    return user_msg


# -------- Intent Prediction --------
def predict_intent(message):
    msg_vec = nlp(message).vector

    sims = np.dot(pattern_vectors, msg_vec) / (
        np.linalg.norm(pattern_vectors, axis=1) * np.linalg.norm(msg_vec)
    )

    best_index = np.argmax(sims)
    score = sims[best_index]

    predicted_tag = pattern_tags[best_index]
    return predicted_tag, score


def get_response(tag):
    for intent in intents["intents"]:
        if intent["tag"] == tag:
            return np.random.choice(intent["responses"])
    return "I’m not fully sure — could you rephrase that?"


# -------- Routes --------
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    user_msg = request.json["message"]

    contextual_message = build_context_prompt(user_msg)

    tag, score = predict_intent(contextual_message)

    if score < 0.60:
        tag = "fallback"

    bot_reply = get_response(tag)

    add_to_memory("user", user_msg)
    add_to_memory("bot", bot_reply)

    return jsonify({"response": bot_reply, "tag": tag})


if __name__ == "__main__":
    app.run(debug=True)
