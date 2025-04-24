class TelegramAPI {
  constructor() {
    this.botToken = "7561647559:AAHuAYYJDl2kjJZ9qwYg2tckHiKfTXK40cg";
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async #handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.description}`);
    }
    return response.json();
  }

  async #fetchTelegram(endpoint, body) {
    const response = await fetch(`${this.apiUrl}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.#handleResponse(response);
  }

  async enviarMensajeMasivo(mensaje, chatIds) {
    try {
      const promesasEnvio = chatIds.map((chatId) =>
        this.#fetchTelegram("sendMessage", {
          chat_id: chatId,
          text: mensaje,
          parse_mode: "HTML",
        }).catch((error) => {
          console.error(`Error enviando mensaje a ${chatId}:`, error);
          return { error: true, chatId, mensaje: error.message };
        })
      );

      const resultados = await Promise.allSettled(promesasEnvio);
      const exitosos = resultados.filter(
        (r) => r.status === "fulfilled" && !r.value?.error
      ).length;
      const fallidos = resultados.filter(
        (r) => r.status === "rejected" || r.value?.error
      ).length;

      return {
        success: exitosos > 0,
        mensaje: `Mensaje enviado a ${exitosos} usuarios. Fallos: ${fallidos}`,
        detalles: {
          total: chatIds.length,
          exitosos,
          fallidos,
        },
      };
    } catch (error) {
      console.error("Error en envío masivo:", error);
      return {
        success: false,
        mensaje: "Error al enviar mensajes masivos",
        error: error.message,
        detalles: {
          total: chatIds.length,
          exitosos: 0,
          fallidos: chatIds.length,
        },
      };
    }
  }
}

// Instanciamos la clase
const telegram = new TelegramAPI();

// Lista de chat_ids
const chatIds = [7916186377, 8172917124, 7554800275, 5691578531];

const mensaje = `🚨 <b>Mensaje de Prueba</b>

¡Hola a todos! Soy el bot ayudante programado para dar apoyo a Logistica, estoy trabajando para mejorar el sistema de notificaciones asegurandome de que funcione correctamente!.

Saludos.`;

// Verificación del token
console.log("Bot Token:", "Configurado");
console.log("Intentando enviar mensaje a:", chatIds);
console.log(
  "URL del bot:",
  `https://api.telegram.org/bot${telegram.botToken.substring(0, 5)}...`
);

telegram
  .enviarMensajeMasivo(mensaje, chatIds)
  .then((resultado) => {
    if (!resultado.success || resultado.detalles.fallidos > 0) {
      console.log("\n❌ Error: Los mensajes no fueron enviados");
      console.log(`✅ Enviados: ${resultado.detalles.exitosos}`);
      console.log(`❌ Fallidos: ${resultado.detalles.fallidos}`);
      if (resultado.error) console.log("Error:", resultado.error);
    } else {
      console.log("\n✅ Todos los mensajes fueron enviados exitosamente");
    }
    console.log("\nResultado detallado:", resultado);
  })
  .catch((error) => {
    console.error("\n❌ Error general:", error.message);
  });
