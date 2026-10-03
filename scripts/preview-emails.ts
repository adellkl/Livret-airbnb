import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderAccountEmail } from '../src/lib/email/templates';

async function main() {
  const output = resolve(process.argv[2] || '/tmp/monlivret-email-previews');
  await mkdir(output, { recursive: true });
  for (const kind of ['verification', 'password-reset', 'welcome'] as const) {
    const path = kind === 'verification' ? '/confirmer-adresse' : kind === 'password-reset' ? '/reinitialiser-mot-de-passe' : '/proprietaire/tableau-de-bord';
    const { html } = renderAccountEmail(kind, `https://livret-airbnb-five.vercel.app${path}${kind === 'welcome' ? '' : '?oobCode=EXEMPLE_NON_VALIDE'}`);
    await writeFile(resolve(output, `${kind}.html`), html);
  }
  await writeFile(resolve(output, 'index.html'), `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Emails Mon Livret — aperçu</title><style>body{margin:0;background:#f5f0e8;font-family:Arial;color:#20362c}header{padding:28px 32px}h1{font-family:Georgia;font-weight:normal;margin:0 0 18px}nav{display:flex;gap:12px;flex-wrap:wrap}button{border:1px solid #d9d1c6;background:#fffdf9;border-radius:9px;padding:10px 16px;color:#20362c;cursor:pointer}button.active{background:#20362c;color:white}iframe{border:0;width:100%;height:1150px}p{font-size:12px;color:#68756b}</style><header><h1>Les emails de Mon Livret</h1><nav><button class="active" data-src="verification">Confirmation d’inscription</button><button data-src="password-reset">Mot de passe oublié</button><button data-src="welcome">Bienvenue</button></nav><p>Aperçu avec des liens fictifs. Expéditeur : Mon Livret &lt;monlivret.1@gmail.com&gt;.</p></header><iframe title="Aperçu de l’e-mail" src="verification.html"></iframe><script>document.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{document.querySelector('iframe').src=b.dataset.src+'.html';document.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));}));</script></html>`);
  console.log(`Aperçus enregistrés dans ${output}`);
}
void main();
