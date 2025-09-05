import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

/**
 * Envía un correo electrónico utilizando el transportador configurado.
 * @param options - Las opciones del correo: destinatario, asunto y contenido HTML.
 */
export const sendEmail = async (options: EmailOptions) => {
    try {
        const info = await transporter.sendMail({
            from: `"ChatHub" <${process.env.MAIL_FROM}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        console.log('Correo de verificación enviado a: %s', options.to);
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        throw new Error('No se pudo enviar el correo de verificación.');
    }
};

/**
 * Genera y envía un correo de verificación de cuenta.
 * @param to - La dirección de correo del destinatario.
 * @param verificationUrl - La URL que el usuario debe visitar para verificar su cuenta.
 */
export const sendVerificationEmail = async (to: string, verificationUrl: string) => {
    const subject = 'Verifica tu cuenta en ChatHub';
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
            <h1 style="color: #0056b3; text-align: center;">¡Bienvenido a ChatHub!</h1>
            <p>Gracias por registrarte. Solo falta un paso más. Por favor, haz clic en el siguiente botón para verificar tu dirección de correo electrónico y activar tu cuenta:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                    Verificar mi Cuenta
                </a>
            </p>
            <p>Si el botón no funciona, copia y pega la siguiente URL en tu navegador:</p>
            <p style="font-size: 0.9em; word-break: break-all; color: #007bff;">${verificationUrl}</p>
            <p>Si no te registraste en ChatHub, puedes ignorar este mensaje de forma segura.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;"/>
            <p style="font-size: 0.8em; color: #777; text-align: center;">© ChatHub</p>
        </div>
    `;

    await sendEmail({ to, subject, html });
};
