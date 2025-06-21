import os
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from flask_cors import CORS
import requests
from sarvamai import SarvamAI
from sarvamai.play import save

load_dotenv()

app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
CHROMA_PERSIST_DIR = "chroma_db"
DEFAULT_KB_FILE = "KnowledgeBase.pdf"

client = SarvamAI(api_subscription_key="3eb1b62e-2cd8-410b-9004-52cd0403bb02")

llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0)

system_prompt = (
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer the question. "
    "If you don't know the answer, say that you don't know. "
    "Use three sentences max and keep it concise.\n\n{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

def process_pdf(file_path):
    loader = PyPDFLoader(file_path)
    data = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000)
    docs = splitter.split_documents(data)

    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

    if os.path.exists(CHROMA_PERSIST_DIR):
        vectorstore = Chroma(
            persist_directory=CHROMA_PERSIST_DIR,
            embedding_function=embeddings
        )
        vectorstore.add_documents(docs)
    else:
        vectorstore = Chroma.from_documents(
            documents=docs,
            embedding=embeddings,
            persist_directory=CHROMA_PERSIST_DIR
        )

    vectorstore.persist()

@app.route("/api/view_default_file")
def view_default_file():
    return send_from_directory(os.getcwd(), DEFAULT_KB_FILE)

@app.route("/api/translate", methods=["POST"])
def translate_text():
    data = request.get_json() or request.form
    input_text = data.get("input")
    source_lang = data.get("source_language_code", "auto")
    target_lang = data.get("target_language_code", "en-IN")
    if not input_text:
        return jsonify({"error": "Input text missing"}), 400
    url = "https://api.sarvam.ai/translate"
    headers = {
        "api-subscription-key": "3eb1b62e-2cd8-410b-9004-52cd0403bb02",
        "Content-Type": "application/json"
    }
    payload = {
        "input": input_text,
        "source_language_code": source_lang,
        "target_language_code": target_lang
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/tts", methods=["POST"])
def tts():
    data = request.get_json() or request.form
    text = data.get("text")
    target_lang = data.get("target_language_code", "en-IN")
    model = data.get("model", "bulbul:v2")
    speaker = data.get("speaker", "anushka")
    if not text:
        return jsonify({"error": "Text missing"}), 400
    audio = client.text_to_speech.convert(
        target_language_code=target_lang,
        text=text,
        model=model,
        speaker=speaker
    )
    # Save to a temp file
    out_path = "output1.wav"
    save(audio, out_path)
    return send_from_directory(os.getcwd(), out_path, as_attachment=False, mimetype="audio/wav")

@app.route("/api/ask", methods=["POST"])
def ask():
    data = request.json
    query = data.get("query")
    if not query:
        return jsonify({"error": "Query missing"}), 400
    vectorstore = Chroma(
        persist_directory=CHROMA_PERSIST_DIR,
        embedding_function=GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    )
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 10})
    qa_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, qa_chain)
    response = rag_chain.invoke({"input": query})
    answer = response.get("answer", "Sorry, I don't have the answer to that.")
    return jsonify({"answer": answer})

@app.route("/api/voice-ask", methods=["POST"])
def voice_ask():
    data = request.json
    query = data.get("query")
    target_lang = data.get("target_language_code", "en-IN")
    tts_model = data.get("tts_model", "bulbul:v2")
    tts_speaker = data.get("tts_speaker", "anushka")
    if not query:
        return jsonify({"error": "Query missing"}), 400
    # Translate to English for RAG
    translation = requests.post(
        "http://localhost:5000/api/translate",
        json={"input": query, "source_language_code": "auto", "target_language_code": "en-IN"},
        headers={"Content-Type": "application/json"}
    )
    translation.raise_for_status()
    translated = translation.json().get("translated_text", query)
    vectorstore = Chroma(
        persist_directory=CHROMA_PERSIST_DIR,
        embedding_function=GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    )
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 10})
    qa_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, qa_chain)
    response = rag_chain.invoke({"input": translated})
    answer = response.get("answer", "Sorry, I don't have the answer to that.")
    # Translate answer back to user's language
    if target_lang != "en-IN":
        back_translation = requests.post(
            "http://localhost:5000/api/translate",
            json={"input": answer, "source_language_code": "en-IN", "target_language_code": target_lang},
            headers={"Content-Type": "application/json"}
        )
        back_translation.raise_for_status()
        answer_translated = back_translation.json().get("translated_text", answer)
    else:
        answer_translated = answer
    # Generate TTS audio for the translated answer
    audio = client.text_to_speech.convert(
        target_language_code=target_lang,
        text=answer_translated,
        model=tts_model,
        speaker=tts_speaker
    )
    out_path = "output1.wav"
    save(audio, out_path)
    return send_from_directory(os.getcwd(), out_path, as_attachment=False, mimetype="audio/wav")

@app.route("/api/upload", methods=["POST"])
def upload_file():
    use_default = request.form.get("use_default_file") == "true"

    if use_default:
        path = os.path.join(os.getcwd(), DEFAULT_KB_FILE)
        process_pdf(path)
        return jsonify({"success": True})

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filepath = os.path.join(os.getcwd(), file.filename)
    file.save(filepath)
    process_pdf(filepath)

    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(debug=True)
