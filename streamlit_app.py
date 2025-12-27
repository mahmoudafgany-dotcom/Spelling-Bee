import streamlit as st
import google.generativeai as genai
from gtts import gTTS
import io

# --- BRANDING & UI ---
st.set_page_config(page_title="Al-Hussan Spelling Bee", page_icon="🏫")
st.markdown("<h3 style='text-align: center;'>🏫 AL-HUSSAN MODEL SCHOOL FOR BOYS</h3>", unsafe_allow_html=True)
st.markdown("<h1 style='text-align: center;'>Spelling Bee Practice</h1>", unsafe_allow_html=True)

# --- API SETUP ---
# You will add your API Key in the Streamlit "Secrets" later
if "GOOGLE_API_KEY" in st.secrets:
    genai.configure(api_key=st.secrets["GOOGLE_API_KEY"])

# --- SESSION STATE ---
if "words" not in st.session_state:
    st.session_state.words = []
if "current_index" not in st.session_state:
    st.session_state.current_index = 0

# --- PAGE 1: INPUT ---
if not st.session_state.words:
    st.write("Add all the words you need to practice in the box below, separate them with a space or a comma.")
    user_input = st.text_area("Word List", placeholder="apple, banana, geography...")
    if st.button("Start Practicing"):
        if user_input:
            st.session_state.words = [w.strip() for w in user_input.replace(',', ' ').split()]
            st.rerun()

# --- PAGE 2: PRACTICE ---
else:
    word = st.session_state.words[st.session_state.current_index]
    st.subheader(f"Word {st.session_state.current_index + 1} of {len(st.session_state.words)}")

    # Speaker to Pronounce
    if st.button("🔊 Hear Word"):
        tts = gTTS(text=word, lang='en')
        audio_fp = io.BytesIO()
        tts.write_to_fp(audio_fp)
        st.audio(audio_fp, format="audio/mp3", autoplay=True)

    # Microphone to Record
    audio_data = st.audio_input("🎤 Spell the word letter by letter")

    if audio_data:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content([
            f"The correct word is '{word}'. Check if this student spelled it correctly in the audio.",
            {"mime_type": "audio/wav", "data": audio_data.read()}
        ])
        st.info(response.text)
        
        if st.button("Next Word"):
            if st.session_state.current_index < len(st.session_state.words) - 1:
                st.session_state.current_index += 1
                st.rerun()
            else:
                st.success("List Completed!")
                if st.button("Restart"):
                    st.session_state.words = []
                    st.session_state.current_index = 0
                    st.rerun()

# --- FOOTER ---
st.markdown("<br><hr><center>Developed by: Mahmoud Afgany</center>", unsafe_allow_html=True)
