# Saga Hrafnkels
Progetto finale per il corso di Visualizzazione delle Informazioni dell'A.A. 2024/2025.  

## La storia
La [saga Hrafnkels](https://en.wikipedia.org/wiki/Hrafnkels_saga) è una delle saghe islandesi più celebri, ambientata nel X secolo.  
Racconta la storia di Hrafnkell Freysgoði, un potente capo e devoto del dio Freyr, noto per il suo cavallo sacro Freyfaxi.  
La vicenda ruota attorno al conflitto tra Hrafnkell e un giovane servo che viola un giuramento sacro, scatenando una catena di vendette, sconfitte e rivincite.  

## Il dataset
La [rete](dataset/hrafnkel_saga_network.xlsx) della Saga Hrafnkel descrive le relazioni tra i protagonisti della saga.  
  
Il foglio di calcolo "hrafnkel_nodes" contiene i personaggi:
- id: l'id del personaggio;  
- label: il nome del personaggio;  
- gender: il codice del genere del personaggio, come descritto nel foglio di calcolo "gender_codes";  
- chapter: il capitolo in cui il personaggio appare per la prima volta;  
- page: la pagina in cui il personaggio è menzionato la prima volta.  
  
Il foglio di calcolo "hrafnkel_edges" contiene le interazioni tra i personaggi:
- source: l'id del primo personaggio;
- sink: l'id del secondo personaggio coinvolto nell'interazione;
- action: il codice dell'azione, come descritto nel foglio di calcolo "action_codes";
- chapter: il capitolo in cui l'azione è descritta;
- page: la pagina in cui l'azione è descritta.   
