class TelegramBot {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
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

  async enviarMensajeConUbicacion(chatId, mensaje, latitud, longitud) {
    try {
      console.log("Token:", process.env.TELEGRAM_BOT_TOKEN); // Para debug
      console.log("ChatId:", chatId);
      if (!chatId) throw new Error("Chat ID es requerido");
      if (!mensaje) throw new Error("Mensaje es requerido");
      if (!latitud || !longitud)
        throw new Error("Latitud y longitud son requeridos");

      const [mensajeRes, ubicacionRes] = await Promise.all([
        this.#fetchTelegram("sendMessage", {
          chat_id: chatId,
          text: mensaje,
          parse_mode: "HTML",
        }),

        this.#fetchTelegram("sendLocation", {
          chat_id: chatId,
          latitude: latitud,
          longitude: longitud,
        }),
      ]);

      return {
        success: true,
        message: "Mensaje y ubicación enviados correctamente",
        data: {
          mensaje: mensajeRes.result,
          ubicacion: ubicacionRes.result,
        },
      };
    } catch (error) {
      console.error("Error detallado:", error);
      return {
        success: false,
        message: error.message || "Error desconocido",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async enviarMensaje(chatId, mensaje) {
    return this.#fetchTelegram("sendMessage", {
      chat_id: chatId,
      text: mensaje,
      parse_mode: "HTML",
    });
  }

  async enviarMensajeMasivo(mensaje, chatIds) {
    try {
      const promesasEnvio = chatIds.map((chatId) =>
        this.#fetchTelegram("sendMessage", {
          chat_id: chatId,
          text: mensaje,
          parse_mode: "HTML",
        }).catch((error) => {
          console.error(`Error enviando mensaje a ${chatId}:`, error.message);
          // Retornamos un objeto con error en lugar de null
          return { error: true, chatId, mensaje: error.message };
        })
      );

      const resultados = await Promise.allSettled(promesasEnvio);

      // Mejoramos la detección de errores
      const exitosos = resultados.filter(
        (r) => r.status === "fulfilled" && !r.value?.error
      ).length;

      const fallidos = resultados.filter(
        (r) => r.status === "rejected" || r.value?.error
      ).length;

      return {
        success: exitosos > 0 && fallidos === 0, // Solo es exitoso si no hay fallos
        mensaje: `Mensaje enviado a ${exitosos} usuarios. Fallos: ${fallidos}`,
        detalles: {
          total: chatIds.length,
          exitosos,
          fallidos,
        },
        error:
          fallidos > 0 ? "Algunos mensajes no pudieron ser enviados" : null,
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

module.exports = new TelegramBot();
