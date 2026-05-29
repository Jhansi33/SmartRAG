import os
import io
import docx
from pypdf import PdfReader

class TextProcessor:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """Extract text content from raw PDF file bytes."""
        text = ""
        try:
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            raise ValueError(f"Error parsing PDF file: {str(e)}")
        return text

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        """Extract text content from raw DOCX file bytes."""
        text = ""
        try:
            docx_file = io.BytesIO(file_bytes)
            doc = docx.Document(docx_file)
            for paragraph in doc.paragraphs:
                if paragraph.text:
                    text += paragraph.text + "\n"
        except Exception as e:
            raise ValueError(f"Error parsing DOCX file: {str(e)}")
        return text

    @staticmethod
    def extract_text_from_txt(file_bytes: bytes) -> str:
        """Extract text content from raw UTF-8 encoded text bytes."""
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            raise ValueError(f"Error parsing TXT file: {str(e)}")

    @classmethod
    def extract_text(cls, filename: str, file_bytes: bytes) -> str:
        """Central parser extracting text based on file extension."""
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            return cls.extract_text_from_pdf(file_bytes)
        elif ext == ".docx":
            return cls.extract_text_from_docx(file_bytes)
        elif ext == ".txt":
            return cls.extract_text_from_txt(file_bytes)
        else:
            raise ValueError(f"Unsupported file type '{ext}'. Supported types are .pdf, .docx, .txt")

    @staticmethod
    def split_text_into_chunks(text: str, chunk_size: int = 800, chunk_overlap: int = 150) -> list[str]:
        """Split text recursively into manageable chunks with semantic overlaps."""
        if not text.strip():
            return []
            
        words = text.split()
        chunks = []
        
        # Approximate words counts since characters split can chop words in half
        # 1 word ~ 5 characters. So chunk_size 800 chars ~ 150 words.
        word_chunk_size = max(10, int(chunk_size / 5))
        word_overlap = max(2, int(chunk_overlap / 5))
        
        step = word_chunk_size - word_overlap
        if step <= 0:
            step = word_chunk_size // 2
            
        for i in range(0, len(words), step):
            chunk_words = words[i:i + word_chunk_size]
            chunk_text = " ".join(chunk_words)
            if chunk_text.strip():
                chunks.append(chunk_text)
                
            # If we've reached the end of the words list, break
            if i + word_chunk_size >= len(words):
                break
                
        return chunks
