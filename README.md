# vis-saga-hrafnkels
Progetto finale per il corso di Visualizzazione delle Informazioni dell'A.A. 2024/2025.  
  
La saga Hrafnkels è una delle saghe islandesi che racconta delle avventure dei capitani e dei contadini nell'est dell'Islanda nel decimo secolo. La rete della Saga Hrafnkel descrive le relazioni tra i protagonisti della saga. La rete è disponibile come un file Excel con un foglio di calcolo per i nodi, un foglio di calcolo per gli archi e due fogli di calcolo per i riferimenti dei codici. I dati possono essere scaricati qui [2].

Il foglio di calcolo "hrafnkel_nodes" contiene i personaggi:

id: l'id del personaggio
label: il nome del personaggio
gender: il codice del genere del personaggio, come descritto nel foglio di calcolo "gender_codes"
chapter: il capitolo in cui il personaggio appare per la prima volta
page: la pagina in cui il personaggio è menzionato la prima volta
Il foglio di calcolo "hrafnkel_edges" contiene le interazioni tra i personaggi:

source: l'id del primo personaggio
sink: l'id del secondo personaggio coinvolto nell'interazione
action: il codice dell'azione, come descritto nel foglio di calcolo "action_codes"
chapter: il capitolo in cui l'azione è descritta
page: la pagina in cui l'azione è descritta
Da osservare il grafo della saga Hrafnkel contiene due componenti connesse separate, una delle quali ha solo sei vertici. Questa piccola componente connessa corrisponde alla seguente frase:
It was in the days of King Harald Fair-hair, son of Halfdan the Black, son of Gudrod the Hunting King, son of Halfdan the Mild and Meal-stingy, son of Eystein Fart, son of Olaf Wood-carver, King of the Swedes, that a man named Hallfred brought his ship to Breiddal in Iceland, below the district of Fljotsdal
