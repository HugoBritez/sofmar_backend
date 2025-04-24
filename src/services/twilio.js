const twilio = require("twilio");

class TwilioService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    // Usar el número fijo del sandbox de Twilio
    this.smsFrom = process.env.TWILIO_PHONE_NUMBER;
    // El número destino desde las variables de entorno
    this.smsTo = process.env.TWILIO_WHATSAPP_TO;

  }

  async enviarSMS(mensaje) {
    try {
      console.log(this.smsFrom, this.smsTo, mensaje);
      const response = await this.client.messages.create({
        from: this.smsFrom, // Número fijo del sandbox
        to: this.smsTo,
        body: mensaje,
      });

      console.log("Mensaje SMS enviado:", response.sid);
      console.log("Mensaje SMS enviado:", response.body);
      console.log("Mensaje SMS enviado:", response.to);
      console.log("Mensaje SMS enviado:", response.from);
      return true;

    } catch (error) {
      console.error("Error SMS WhatsApp:", error);
      return false;
    }
  }
}

module.exports = new TwilioService();

// const twilio = require("twilio");


// class TwilioService {
//   constructor() {
//     this.client = twilio(
//       process.env.TWILIO_ACCOUNT_SID,
//       process.env.TWILIO_AUTH_TOKEN
//     );
//     // Usar el número de Twilio para SMS (sin el prefijo whatsapp:)
//     this.smsFrom = process.env.TWILIO_PHONE_NUMBER;
//   }

//   async enviarSMS(mensaje, numeros) {
//     try {
//       const numerosDestino = Array.isArray(numeros) ? numeros : [numeros];

//       const resultados = await Promise.all(
//         numerosDestino.map(async (numero) => {
//           const response = await this.client.messages.create({
//             from: this.smsFrom,
//             to: numero,
//             body: mensaje,
//           });

//           console.log(`SMS enviado a ${numero}:`, response.sid);
//           return response;
//         })
//       );

//       return resultados;
//     } catch (error) {
//       console.error("Error enviando SMS:", error);
//       throw error;
//     }
//   }
// }

// module.exports = new TwilioService();
