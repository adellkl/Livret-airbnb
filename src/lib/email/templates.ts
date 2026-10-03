import { CONTACT_EMAIL } from '@/config/contact';

export type AccountEmailKind = 'verification' | 'password-reset' | 'welcome';

const copy = {
  verification: {
    subject: 'Bienvenue sur Mon Livret — confirmez votre adresse',
    eyebrow: 'VOTRE ESPACE EST PRÊT',
    title: 'Les beaux séjours commencent ici.',
    intro: 'Merci d’avoir choisi Mon Livret. Il ne reste qu’une étape pour confirmer votre inscription : valider votre adresse e-mail.',
    cta: 'Confirmer mon adresse e-mail',
    detail: 'Vous pourrez ensuite rassembler les informations de votre logement et préparer un accueil qui vous ressemble.',
    security: 'Vous n’êtes pas à l’origine de cette inscription ? Ignorez cet e-mail. Aucun mot de passe ne vous sera demandé pour confirmer votre adresse.',
  },
  'password-reset': {
    subject: 'Mon Livret — choisissez un nouveau mot de passe',
    eyebrow: 'VOTRE COMPTE, EN TOUTE SÉCURITÉ',
    title: 'Retrouvez votre espace.',
    intro: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Mon Livret. Utilisez le bouton ci-dessous pour en choisir un nouveau.',
    cta: 'Choisir un nouveau mot de passe',
    detail: 'Ce lien est personnel et utilisable une seule fois. S’il a expiré, vous pourrez en demander un nouveau depuis la page de connexion.',
    security: 'Vous n’avez pas fait cette demande ? Ignorez cet e-mail : votre mot de passe reste inchangé.',
  },
  welcome: {
    subject: 'Bienvenue chez Mon Livret — votre premier livret vous attend',
    eyebrow: 'BIENVENUE CHEZ VOUS',
    title: 'Un accueil à votre image.',
    intro: 'Votre espace Mon Livret est prêt. Vous pouvez maintenant créer un guide clair et chaleureux pour accompagner vos voyageurs, de leur arrivée à leur départ.',
    cta: 'Créer mon premier livret',
    detail: 'Ajoutez votre logement, rassemblez les informations utiles, puis partagez votre livret par lien ou QR code. Vous avancez à votre rythme.',
    security: 'Cet e-mail fait suite à la création de votre compte Mon Livret.',
  },
} as const;

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

export function renderAccountEmail(kind: AccountEmailKind, actionUrl: string) {
  const url = new URL(actionUrl);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password
    || (url.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(url.hostname))) {
    throw new Error('Invalid account email action URL');
  }
  const content = copy[kind];
  const action = escapeEmailHtml(url.href);
  const text = `Bonjour,\n\n${content.intro}\n\n${content.cta} :\n${url.href}\n\n${content.detail}\n\n${content.security}\n\nUne question ? Répondez à cet e-mail ou écrivez à ${CONTACT_EMAIL}.\n\nÀ bientôt,\nL’équipe Mon Livret`;
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${content.subject}</title></head>
<body style="margin:0;padding:0;background:#f5f0e8;color:#24342c;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${content.intro}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f0e8;"><tr><td align="center" style="padding:36px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fffdf9;border:1px solid #e7dfd3;border-radius:20px;overflow:hidden;">
<tr><td style="padding:28px 32px;background:#20362c;border-bottom:4px solid #df805b;"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="width:42px;height:42px;border:1px solid #dfb99f;border-radius:12px;text-align:center;color:#edb692;font-family:Georgia,serif;font-size:23px;">m.</td><td style="padding-left:12px;color:#fffdf9;font-family:Georgia,'Times New Roman',serif;font-size:26px;">Mon Livret</td></tr></table></td></tr>
<tr><td style="padding:36px 32px 12px;"><p style="margin:0 0 16px;font-size:10px;line-height:18px;font-weight:bold;letter-spacing:2px;color:#a75937;">${content.eyebrow}</p><h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:35px;line-height:1.15;font-weight:normal;letter-spacing:-1px;">${content.title}</h1></td></tr>
<tr><td style="padding:16px 32px 0;"><p style="margin:0 0 16px;font-size:15px;line-height:25px;">Bonjour,</p><p style="margin:0;font-size:15px;line-height:25px;color:#5b675f;">${content.intro}</p></td></tr>
<tr><td style="padding:28px 32px;"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td align="center" bgcolor="#c9623e" style="border-radius:10px;mso-padding-alt:16px 22px;"><a href="${action}" style="display:inline-block;padding:16px 22px;border:1px solid #c9623e;border-radius:10px;color:#ffffff;text-decoration:none;font-size:14px;line-height:20px;font-weight:bold;">${content.cta}&nbsp; →</a></td></tr></table></td></tr>
<tr><td style="padding:0 32px 28px;"><p style="margin:0;font-size:14px;line-height:24px;color:#5b675f;">${content.detail}</p></td></tr>
<tr><td style="padding:0 32px 28px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0e9;border-radius:12px;"><tr><td style="padding:18px 20px;font-size:12px;line-height:21px;color:#69736c;">${content.security}</td></tr></table></td></tr>
<tr><td style="padding:0 32px 32px;"><p style="margin:0;font-size:14px;line-height:24px;">À bientôt,<br><strong>L’équipe Mon Livret</strong></p><p style="margin:16px 0 0;font-size:12px;line-height:20px;color:#7a817a;">Le bouton ne s’ouvre pas ? Copiez ce lien dans votre navigateur :</p><p style="margin:6px 0 0;font-size:11px;line-height:18px;word-break:break-all;"><a href="${action}" style="color:#9b4f32;text-decoration:underline;word-break:break-all;">${action}</a></p></td></tr>
<tr><td style="padding:22px 32px;border-top:1px solid #ebe4d9;background:#faf7f1;"><p style="margin:0;font-family:Georgia,serif;font-size:17px;color:#394b3f;">Chaque séjour mérite une belle arrivée.</p><p style="margin:10px 0 0;font-size:12px;line-height:21px;color:#778176;">Une question ? Répondez simplement à cet e-mail.<br><a href="mailto:${CONTACT_EMAIL}" style="color:#526653;">${CONTACT_EMAIL}</a></p></td></tr>
</table><p style="margin:20px 0 0;font-size:10px;letter-spacing:1px;color:#959c91;">MON LIVRET · L’ART DE BIEN ACCUEILLIR</p>
</td></tr></table></body></html>`;
  return { subject: content.subject, html, text };
}
