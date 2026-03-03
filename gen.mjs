import fs from "fs";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY mancante.");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const path = "data/news.json";

let arr = [];
try {
  arr = JSON.parse(fs.readFileSync(path, "utf8"));
  if (!Array.isArray(arr)) arr = [];
} catch {
  arr = [];
}

const recentTitles = arr
  .slice(0, 40)
  .map(x => x.title)
  .filter(Boolean)
  .join(" | ") || "(nessuno)";

const prompt = `
Devi scrivere un articolo per il blog dello Studio Paganelli.

Studio Paganelli opera sul territorio ligure, prevalentemente a Loano.
Genova può essere citata solo come riferimento a casi passati, magari quando l'articolo riguarda questioni legate a grandi edifici o complessi (supercondomini, palazzoni, etc..)

TEMI GIÀ TRATTATI (NON RIPETERE):
${recentTitles}

Regola anti-ripetizione:
- Non ripetere né riformulare temi simili.

SCRIVI:
Un articolo di circa 400 parole su un tema concreto di gestione condominiale: puoi spaziare dalle assemblee (maggioranze, deleghe, chi mantiene l'ordine etc..) a problemi concreti (infiltrazioni, polizza, adempimenti fiscali, risponsabilità per la sicurezza, etc..). Sono solo esempi, puoi spaziare in quegli ambiti. 

TONO:
- autorevole ma non accademico
- professionale ma accessibile
- ironia leggera e intelligente
- conclusioni ferme

STILE:
- Parti da un problema o casistiche reali (con un 20% di probabilità di generare un testo che contiene riferimenti a "esperienza diretta" vissuta durante la mia vita lavorativa come amministratore e come è stata gestita positivamente)
- Evita burocratese se non in pochi e fondamentali passaggi.
- Inserisci sezione finale di riepilogo in un elenco di 3-5 punti, chiamato "Focus"

Firma finale obbligatoria:
Studio Paganelli – Amministrazione e consulenza condominiale in Liguria.
`.trim();

const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-5.1",
    input: prompt,
    max_output_tokens: 2000
  })
});

if (!response.ok) {
  console.error(await response.text());
  process.exit(1);
}

const data = await response.json();

let text = "";

if (data.output_text) {
  text = data.output_text;
} else if (Array.isArray(data.output)) {
  for (const item of data.output) {
    if (item.content) {
      for (const c of item.content) {
        if (c.text) text += c.text;
      }
    }
  }
}

text = text.trim();

if (!text) {
  console.error("Risposta vuota dal modello.");
  process.exit(1);
}

// Costruiamo noi il titolo dalla prima riga
const firstLine = text.split("\n")[0].trim();
const title = firstLine.length > 10 ? firstLine : "Nuova pillola di condominio";

const entry = {
  date: today,
  title: title,
  body: text,
  tags: []
};

const filtered = arr.filter(x => x.date !== today);
filtered.unshift(entry);

fs.writeFileSync(path, JSON.stringify(filtered.slice(0, 180), null, 2));
console.log("news.json aggiornato con successo.");
