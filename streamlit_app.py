import streamlit as st
import google.generativeai as genai
from gtts import gTTS
import io

# --- 1. BRANDING ---
st.set_page_config(page_title="Al-Hussan Spelling Bee", page_icon="🏫")
st.markdown("<div style='text-align: center;'><h3>🏫 AL-HUSSAN MODEL SCHOOL FOR BOYS</h3><h1>Spelling Bee Practice</h1></div>", unsafe_allow_html=True)

# --- 2. API CONFIGURATION ---
if "GOOGLE_API_KEY" in st.secrets:
    # Use the most basic configuration to avoid version conflicts
    genai.configure(api_key=st.secrets["GOOGLE_API_KEY"])
else:
    st.error("❌ API Key Missing in Secrets!")
    st.stop()

# --- 3. SESSION STATE ---
if "words" not in st.session_state:
    st.session_state.words = []
if "current_index" not in st.session_state:
    st.session_state.current_index = 0

# --- 4. APP INTERFACE ---
if not st.session_state.words:
    st.write("Add your words below, separated by commas.")
    user_input = st.text_area("Word List", placeholder="apple, banana, geography...")
    if st.button("START PRACTICING", use_container_width=True):
        if user_input:
            st.session_state.words = [w.strip() for w in user_input.replace(',', ' ').split() if w.strip()]
            st.rerun()
else:
    word = st.session_state.words[st.session_state.current_index]
    st.subheader(f"Word {st.session_state.current_index + 1} of {len(st.session_state.words)}")

    if st.button("🔊 Pronounce Word"):
        tts = gTTS(text=word, lang='en')
        audio_fp = io.BytesIO()
        tts.write_to_fp(audio_fp)
        st.audio(audio_fp, format="audio/mp3", autoplay=True)

    audio_data = st.audio_input("🎤 Spell the word letter by letter")

    if audio_data:
        try:
            # FIX: We use the most specific model path available
            # This 'models/gemini-1.5-flash' path is the official one for stable v1
            model = genai.GenerativeModel('models/gemini-1.5-flash')
            
            response = model.generate_content([
                f"The word is '{word}'. Listen to this student spelling it letter-by-letter. Tell them if they are correct. If not, show the correct spelling.",
                {"mime_type": "audio/wav", "data": audio_data.read()}
            ])
            st.info(response.text)
        except Exception as e:
            # This will show us if it's still a 404 or a different error
            st.error(f"AI Connection Error: {e}")
        
        if st.button("Next Word"):
            if st.session_state.current_index < len(st.session_state.words) - 1:
                st.session_state.current_index += 1
                st.rerun()
            else:
                st.success("Practice Finished!")
                if st.button("Restart"):
                    st.session_state.words = []
                    st.session_state.current_index = 0
                    st.rerun()

st.markdown("<br><hr><center>Developed by: Mahmoud Afgany</center>", unsafe_allow_html=True)
