# Dottor Grock

Studio di **medicina e chirurgia**: diagnosi differenziale, lettura di foto e video clinici, scienza e coscienza.

Non è una visita. Non prescrive. Non certifica. In emergenza, in Italia, il numero è il **118**.

## Cosa fa

- Consulto in tutte le branche, con le tecniche più attuali
- Diagnosi differenziale ordinata (alta / media / bassa)
- Segnali d’allarme, passi successivi, nota di coscienza
- Allegati clinici: foto e fotogrammi da video (i metadati di posizione vengono rimossi)

## Avvio

Serve Node 22 e una chiave xAI (`XAI_API_KEY`) per i consulti.

```bash
npm install
XAI_API_KEY=… npm run dev
```

L’app ascolta su `0.0.0.0:8080`.

## Stack

React 19, TanStack Start, Tailwind v4, zustand. I consulti restano sul dispositivo (`localStorage`).

## Etica

Orientamento, non diagnosi ufficiale. I dati clinici non vanno su un database di questo repo.
