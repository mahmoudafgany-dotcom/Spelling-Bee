import streamlit as st
import google.generativeai as genai
from gtts import gTTS
import io

# --- 1. BRANDING ---
st.set_page_config(page_title="Al-Hussan Spelling Bee", page_icon="🏫")

st.markdown("<div style='text-align: center;'><h3>🏫 AL-HUSSAN MODEL SCHOOL FOR BOYS</h3><h1>Spelling Bee Practice</h1></div>", unsafe_allow_html=True)

# --- 2. API CONFIGURATION ---
# This looks for your key in the Streamlit Secrets
if "GOOGLE_API_KEY" in st.secrets:
    genai.configure(api_key=st.secrets["GOOGLE_API_KEY"])

# --- 3. SESSION STATE ---
if "words" not in st.session_state:
    st.session_state.words = []
if "current_index" not in st.session_state:
    st.session_state.current_index = 0

# --- 4. INTERFACE ---
if not st.session_state.words:
    st.write("Add all the words you need to practice in the box below, separate them with a space or a comma.")
    user_input = st.text_area("Word List", placeholder="example: atmosphere, equation, logic...")
    
    if st.button("START PRACTICING", use_container_width=True):
        if user_input:
            st.session_state.words = [w.strip() for w in user_input.replace(',', ' ').split() if w.strip()]
            st.rerun()
else:
    # Practice Page
    word = st.session_state.words[st.session_state.current_index]
    st.subheader(f"Word {st.session_state.current_index + 1} of {len(st.session_state.words)}")

    # Speaker Button
    if st.button("🔊 Pronounce Word"):
        tts = gTTS(text=word, lang='en')
        audio_fp = io.BytesIO()
        tts.write_to_fp(audio_fp)
        st.audio(audio_fp, format="audio/mp3", autoplay=True)

    # Microphone Input
    audio_data = st.audio_input("🎤 Spell the word letter by letter")

    if audio_data:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content([
            f"The word is '{word}'. Listen to this student spelling it letter-by-letter. Tell them if they are correct. If not, show the correct spelling.",
            {"mime_type": "audio/wav", "data": audio_data.read()}
        ])
        ])
        st.info(response.text)
        
        if st.button("Next Word"):
            if st.session_state.current_index < len(st.session_state.words) - 1:
                st.session_state.current_index += 1
                st.rerun()
            else:
                st.success("You finished the list!")
                if st.button("Restart"):
                    st.session_state.words = []
                    st.session_state.current_index = 0
                    st.rerun()

# --- 5. FOOTER ---
st.markdown("<br><hr><center>Developed by: Mahmoud Afgany</center>", unsafe_allow_html=True)
