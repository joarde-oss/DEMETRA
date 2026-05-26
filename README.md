# DEMETRA

Demetra e una dApp Web3 che unisce:

- un brand di calzature running moderne e luxury urban
- una vetrina 3D interattiva
- NFT ERC-721 numerati in limited edition
- un flusso di acquisto on-chain collegato a scarpe fisiche esclusive

Il progetto e stato sviluppato come piattaforma decentralizzata per acquistare, gestire e valorizzare NFT Demetra, utilizzando smart contract in Solidity, test Hardhat e un frontend React + TypeScript con esperienza 3D realizzata con Three.js / React Three Fiber.

## Obiettivo del progetto

L'idea alla base del progetto e costruire un'esperienza piu ricca di una classica dApp NFT:

- l'utente entra in uno showroom 3D
- esplora i modelli di sneaker
- apre la scheda di ogni NFT
- acquista il token tramite wallet
- trova poi gli NFT posseduti nella sezione `My NFT`
- puo verificare la transazione on-chain tramite Etherscan

Ogni NFT rappresenta una scarpa Demetra in edizione limitata e numerata. Il possesso del token e pensato come livello di accesso esclusivo all'edizione fisica corrispondente.

## Stack tecnologico

### Frontend

- React 19
- TypeScript
- Vite
- `@react-three/fiber`
- `@react-three/drei`
- `three`
- `ethers`

### Smart contract / blockchain

- Solidity `0.8.28`
- Hardhat 3
- OpenZeppelin Contracts
- Sepolia testnet

### Deployment

- GitHub
- Vercel

## Funzionalita principali

### Frontend / UX

- homepage brandizzata Demetra
- pagina `Store` con showroom 3D
- pagine dettaglio per ogni sneaker / NFT
- pagina `My NFT` collegata al wallet
- connessione wallet con MetaMask
- supporto mobile e responsive
- metadata pubblici e immagini NFT visibili nel wallet
- link diretto alla transazione su Sepolia Etherscan

### NFT flow

- gli admin preparano la collezione on-chain
- gli NFT vengono mintati nel treasury del contratto
- ogni NFT ha prezzo `0.01 ETH`
- l'utente collega il wallet
- l'utente acquista l'NFT dalla pagina scarpa
- il contratto trasferisce il token dal treasury all'utente

### Aste

- contratto separato per la gestione delle aste
- creazione asta da parte admin
- offerte in `ETH`
- escrow del token nel contratto asta
- claim del vincitore a fine asta
- refund dei non vincitori tramite `withdrawRefund`

## Architettura smart contract

Il progetto usa due contratti:

### 1. `DemetraCollection.sol`

File: [contracts/DemetraCollection.sol](/Users/jonathan/Desktop/nft/contracts/DemetraCollection.sol)

Responsabilita:

- implementazione ERC-721
- gestione owner/admin
- creazione di nuove collezioni logiche
- mint degli NFT
- gestione `baseURI`
- impostazione prezzo collezione / token
- acquisto NFT dal treasury del contratto
- gestione proceeds

Funzioni principali:

- `createCollection(...)`
- `setAdmin(...)`
- `setCollectionPrice(...)`
- `setCollectionBaseURI(...)`
- `mintTo(...)`
- `mintToTreasury(...)`
- `setTokenPrice(...)`
- `buyNFT(...)`
- `withdrawProceeds(...)`
- `getCollection(...)`
- `tokenURI(...)`

Nota progettuale:

La consegna richiede la creazione di nuove collezioni NFT. In questo progetto la multi-collezione e implementata come **collezioni logiche all'interno dello stesso contratto ERC-721**, non come deploy di un nuovo contratto per ogni collezione. Questa scelta rende l'architettura piu semplice, piu lineare da integrare lato frontend e perfettamente adatta a un catalogo Demetra a drop multipli.

### 2. `DemetraAuction.sol`

File: [contracts/DemetraAuction.sol](/Users/jonathan/Desktop/nft/contracts/DemetraAuction.sol)

Responsabilita:

- gestione aste separata dal contratto NFT
- ricezione NFT in escrow
- gestione offerte in `ETH`
- settlement finale
- refund dei non vincitori
- prelievo proventi da parte del seller

Funzioni principali:

- `createAuction(...)`
- `placeBid(...)`
- `claimAuction(...)`
- `withdrawRefund()`
- `withdrawProceeds()`
- `setAdmin(...)`

## Aderenza alla consegna

### Requisiti ERC-721

Richiesta | Stato
--- | ---
Creare una nuova collezione NFT da parte di un admin | Completato
Trasferire un NFT da un utente a un altro | Completato
Impostare il prezzo di acquisto di un NFT | Completato
Permettere all'utente di acquistare un NFT | Completato
Salvare l'indirizzo del proprietario del contratto | Completato

### Requisiti aste

Richiesta | Stato
--- | ---
Contratto per la gestione delle aste | Completato
Asta inizializzata da admin | Completato
Offerte in Ether verso il contratto | Completato
Riscatto NFT da parte del vincitore a fine asta | Completato
Rimborso totale dei perdenti | Completato

### Testing

Ogni funzionalita principale e coperta con test Hardhat.

File test:

- [test/DemetraCollection.ts](/Users/jonathan/Desktop/nft/test/DemetraCollection.ts)
- [test/DemetraAuction.ts](/Users/jonathan/Desktop/nft/test/DemetraAuction.ts)

Copertura verificata:

- owner del contratto
- creazione collezione
- aggiornamento `baseURI`
- prezzo di vendita
- acquisto NFT
- trasferimento NFT tra utenti
- withdraw dei proventi
- creazione asta
- bid
- claim vincitore
- refund non vincitori
- recupero NFT se l'asta finisce senza offerte

## Esperienza 3D

Uno degli obiettivi del progetto era evitare una dApp puramente tabellare o standard.

Per questo e stata sviluppata una sezione 3D che rende l'esperienza piu accattivante:

- la homepage comunica il posizionamento premium del brand
- la pagina `Store` rappresenta uno showroom digitale
- le scarpe sono cliccabili e portano alle rispettive pagine NFT
- le pagine dettaglio mostrano viewer 3D e reference image

La componente 3D non e decorativa: e parte dell'identita del progetto e differenzia la piattaforma da un marketplace NFT tradizionale.

## Metadata NFT

I metadata degli NFT sono pubblici e serviti dal progetto tramite:

- [public/metadata/1.json](/Users/jonathan/Desktop/nft/public/metadata/1.json)
- [public/metadata/2.json](/Users/jonathan/Desktop/nft/public/metadata/2.json)
- [public/metadata/3.json](/Users/jonathan/Desktop/nft/public/metadata/3.json)
- [public/metadata/4.json](/Users/jonathan/Desktop/nft/public/metadata/4.json)
- [public/metadata/5.json](/Users/jonathan/Desktop/nft/public/metadata/5.json)
- [public/metadata/6.json](/Users/jonathan/Desktop/nft/public/metadata/6.json)

Ogni metadata include:

- `name`
- `description`
- `image`
- `external_url`
- `attributes`

Le immagini puntano a URL pubblici del deploy Vercel, cosi da risultare visibili anche nei wallet.

## Deploy e script

### Script disponibili

- [scripts/deploy.ts](/Users/jonathan/Desktop/nft/scripts/deploy.ts)
  - deploya `DemetraCollection` e `DemetraAuction`
  - crea la collezione `Demetra Genesis`
  - minta 6 NFT nel treasury

- [scripts/deploy-collection.ts](/Users/jonathan/Desktop/nft/scripts/deploy-collection.ts)
  - deploy minimale del solo contratto `DemetraCollection`
  - crea la collezione e minta i 6 NFT

- [scripts/set-base-uri.ts](/Users/jonathan/Desktop/nft/scripts/set-base-uri.ts)
  - aggiorna la `baseURI` della collezione on-chain

### Variabili ambiente

Esempio disponibile in [​.env.example](/Users/jonathan/Desktop/nft/.env.example).

Variabili usate:

- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`
- `VITE_DEMETRA_COLLECTION_ADDRESS`
- `NFT_METADATA_BASE_URI`

## Avvio locale

### Installazione

```bash
npm install
```

### Avvio frontend

```bash
npm run dev
```

### Build produzione

```bash
npm run build
```

### Compilazione contratti

```bash
npm run compile
```

### Test

```bash
npm run test
```

## Deploy su Sepolia

### Deploy completo

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### Deploy solo collection

```bash
npx hardhat run scripts/deploy-collection.ts --network sepolia
```

### Aggiornamento metadata base URI

```bash
npx hardhat run scripts/set-base-uri.ts --network sepolia
```

## Deploy frontend

Il frontend e pensato per essere pubblicato su Vercel.

Flusso usato nel progetto:

1. push su GitHub
2. import del repository in Vercel
3. configurazione env vars
4. deploy pubblico del sito
5. uso del dominio Vercel come base pubblica per metadata NFT

## Wallet e compatibilita

### Testati con buon esito

- browser desktop normali
- MetaMask desktop
- Safari mobile
- Phantom wallet iPhone

### Nota su MetaMask iPhone

Durante lo sviluppo e emerso un comportamento specifico del browser in-app di MetaMask su iPhone:

- le scarpe 3D singole risultano stabili
- la room 3D completa e piu fragile rispetto a Safari / Phantom

Questo non influisce sulla correttezza dei contratti, dei test o del flusso d'acquisto on-chain, ma rappresenta una limitazione del browser wallet mobile rispetto ai browser completi.

## Struttura del progetto

```text
.
├── contracts/
│   ├── DemetraAuction.sol
│   └── DemetraCollection.sol
├── public/
│   ├── metadata/
│   ├── room.glb
│   ├── Shoe1.glb ... Shoe6.glb
│   ├── Shoe1.png ... Shoe6.png
│   └── immagini home/store/about
├── scripts/
│   ├── deploy.ts
│   ├── deploy-collection.ts
│   └── set-base-uri.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── test/
│   ├── DemetraAuction.ts
│   └── DemetraCollection.ts
├── hardhat.config.ts
└── package.json
```

## Conclusione

Demetra e un progetto completo che unisce:

- smart contract ERC-721 e aste
- test Hardhat
- frontend React + TypeScript
- esperienza 3D
- metadata NFT pubblici
- integrazione wallet
- acquisto on-chain reale

La piattaforma non si limita a dimostrare una mint function, ma costruisce un flusso coerente tra branding, interazione 3D, token ownership e accesso esclusivo al prodotto fisico.

## Autore

Sviluppato da **Jonathan Ardelean**.
