import { GoogleGenAI } from "@google/genai";

let customAi: GoogleGenAI | null = null;

const getAi = () => {
    if (typeof window !== 'undefined') {
        try {
            // Read from local storage (must parse raw string, useLocalStorage stores it as JSON but it might be just string, wait it's JSON encoded: '"..."')
            const raw = localStorage.getItem('lumina-apiKey');
            if (raw) {
                const key = JSON.parse(raw);
                if (key && key.trim().length > 0) {
                    if (!customAi) {
                        customAi = new GoogleGenAI({ apiKey: key });
                    }
                    return customAi;
                }
            }
        } catch(e) {
            console.error("Failed to parse local api key", e);
        }
    }
    return new GoogleGenAI({ 
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" 
    });
};

export const summarizeSection = async (text: string) => {
  if (!text) return null;
  
  try {
    const response = await getAi().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Tóm tắt các ghi chú nghiên cứu sau đây thành chính xác 3 luận điểm chính bằng tiếng Việt. 
      Tập trung vào các hiểu biết độc đáo và lập luận cốt lõi. 
      Ghi chú: ${text}`,
    });
    
    return response.text?.split("\n").filter(line => line.trim()) || [];
  } catch (error) {
    console.error("AI Summarization failed:", error);
    return null;
  }
};

export const extractConcepts = async (text: string) => {
  if (!text) return null;

  try {
    const response = await getAi().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Trích xuất các khái niệm hoặc thực thể chính được đề cập trong các ghi chú này dưới dạng danh sách ngăn cách bằng dấu phẩy bằng tiếng Việt. 
      Ghi chú: ${text}`,
    });
    
    return response.text?.split(",").map(c => c.trim()) || [];
  } catch (error) {
    console.error("AI Concept Extraction failed:", error);
    return null;
  }
};

export const generateQuestions = async (text: string) => {
  if (!text) return null;

  try {
    const response = await getAi().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Dựa trên ghi chú nghiên cứu sau, hãy đặt ra 3 câu hỏi phản diện hoặc câu hỏi gợi mở để giúp người nghiên cứu đào sâu hơn vào vấn đề. 
      Trả lời bằng tiếng Việt, ngắn gọn, súc tích.
      Ghi chú: ${text}`,
    });
    
    return response.text?.split("\n").filter(line => line.trim()) || [];
  } catch (error) {
    console.error("AI Question Generation failed:", error);
    return null;
  }
};

export const extractQuotes = async (text: string) => {
  if (!text) return null;

  try {
    const response = await getAi().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Trích xuất 2-3 câu văn đắt giá nhất, cốt lõi nhất từ nội dung sau. Trả lời bằng tiếng Việt, mỗi câu nằm trên một dòng. Không dùng ký tự list/bullet.
      Ghi chú: ${text}`,
    });
    
    return response.text?.split("\n").filter(line => line.trim().length > 5) || [];
  } catch (error) {
    console.error("AI Quotes Extraction failed:", error);
    return null;
  }
};

export const findThemes = async (text: string) => {
  if (!text) return null;

  try {
    const response = await getAi().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Xác định 3-5 chủ đề sâu xa hoặc bao quát nhất từ các ghi chú này dưới dạng danh sách ngăn cách bằng dấu phẩy bằng tiếng Việt.
      Ghi chú: ${text}`,
    });
    
    return response.text?.split(",").map(c => c.trim().replace(/^[-*•]\s*/, '')) || [];
  } catch (error) {
    console.error("AI Theme Extraction failed:", error);
    return null;
  }
};

export const suggestActions = async (text: string) => {
  if (!text) return null;

  try {
    const response = await getAi().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Gợi ý 3 hướng hành động tiếp theo trong quá trình nghiên cứu dựa trên đoạn ghi chú sau. Trả lời bằng tiếng Việt, mỗi hướng đi nằm trên một riêng biệt. Không dùng ký tự list/bullet.
      Ghi chú: ${text}`,
    });
    
    return response.text?.split("\n").filter(line => line.trim().length > 5) || [];
  } catch (error) {
    console.error("AI Action Suggestion failed:", error);
    return null;
  }
};

export const generateTitleForSection = async (text: string) => {
  if (!text || text.length < 30) return null;

  try {
    const response = await getAi().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Tạo một tiêu đề ngắn gọn (2-6 từ), súc tích và hấp dẫn cho đoạn văn bản sau. Chỉ trả về tiêu đề, không có dấu ngoặc kép hay giải thích.
      Văn bản: ${text.substring(0, 800)}`,
    });
    
    return response.text?.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error("AI Title Gen failed:", error);
    return null;
  }
};

export const queryIntel = async (context: string, question: string) => {
  if (!context || !question) return null;

  try {
    const response = await getAi().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Bạn là trợ lý hệ thống hóa tri thức Lumina Intel. 
Hãy trả lời câu hỏi của người dùng dựa trên NGỮ CẢNH là những ghi chú trong không gian nghiến cứu của họ. 
Nếu câu hỏi nằm ngoài ngữ cảnh, hãy dùng kiến thức tổng quát nhưng nhớ chú thích rằng nó không có trong ghi chú. Trả lời chi tiết, mạch lạc và sử dụng định dạng Markdown bằng tiếng Việt.

--- NGỮ CẢNH DỰ ÁN ---
${context}
--- HẾT NGỮ CẢNH ---

CÂU HỎI: ${question}`,
    });
    
    return response.text;
  } catch (error) {
    console.error("AI Query Intel failed:", error);
    return null;
  }
};
