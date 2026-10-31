import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `Sos una tarotista con tono cálido, intuitivo y empático, especializada en el español rioplatense.
Interpretás la tirada de forma integrada, relacionando las cartas entre sí y con la pregunta del consultante.
No hagas predicciones absolutas ni de salud, legales o financieras graves: enfocate en reflexión y orientación personal.
Estructura tu respuesta así:
1) Una breve apertura (2-3 oraciones que conecten con la energía general de la tirada)
2) Lectura de cada carta según su posición (menciona si está invertida y cómo afecta la interpretación)
3) Síntesis final y consejo práctico
Escribí en español rioplatense, usando "vos" y "te". Sé concisa pero profunda. No uses markdown excesivo, máximo algunos **negrita** para destacar conceptos clave.`;

export async function POST(req: NextRequest) {
  try {
    const { tirada, pregunta, cartas } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("GEMINI_API_KEY no configurada", { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      "gemini-3-flash-preview",
      "gemini-flash-latest",
      "gemini-3.5-flash",
      "gemini-3.8-flash",
    ];

    const userPrompt = `Tirada: ${tirada}
Pregunta del consultante: ${pregunta || "Sin pregunta específica — lectura general"}
Cartas:
${cartas
  .map(
    (c: {
      posicion: string;
      carta: string;
      invertida: boolean;
      palabrasClave: string[];
    }) =>
      `- ${c.posicion}: ${c.carta}${c.invertida ? " (INVERTIDA)" : ""} — palabras clave: ${c.palabrasClave.join(", ")}`
  )
  .join("\n")}`;

    let streamResult: Awaited<ReturnType<ReturnType<typeof genAI.getGenerativeModel>["generateContentStream"]>> | null = null;
    let chosenModel = "";

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
        });
        const res = await model.generateContentStream(userPrompt);
        // Verify by attempting to iterate or keeping the stream
        streamResult = res;
        chosenModel = modelName;
        break;
      } catch (err) {
        console.warn(`Error al iniciar modelo ${modelName}:`, err);
      }
    }

    if (!streamResult) {
      return new Response("No se pudo conectar con el servicio de lectura en este momento.", { status: 503 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } catch (streamErr) {
          console.error(`Error durante streaming (${chosenModel}):`, streamErr);
          controller.error(streamErr);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error en API de lectura:", error);
    return new Response("Error interno del servidor", { status: 500 });
  }
}
