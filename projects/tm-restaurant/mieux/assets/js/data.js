window.CATS=[['all','Tout'],['tacos','Tacos'],['antojitos','Antojitos'],['bowls','Quesadillas & Bowls'],['boissons','Boissons'],['dessert','Desserts']];
window.DISHES=[
{id:'t1',c:'tacos',n:'Al Pastor',z:'Le classique',d:'Porc mariné à l’achiote, ananas grillé, coriandre, oignon (×3)',p:12.5,s:1,sig:1},
{id:'t2',c:'tacos',n:'Carnitas',z:'Confit 8 heures',d:'Porc effiloché, oignons pickles, salsa verde (×3)',p:12,s:1},
{id:'t3',c:'tacos',n:'Barbacoa de res',z:'Braisé au guajillo',d:'Bœuf fondant, consommé à tremper, citron vert (×3)',p:13.5,s:2,sig:1},
{id:'t4',c:'tacos',n:'Gobernador',z:'Mer & fromage',d:'Gambas, fromage fondu, poivron, crème chipotle (×3)',p:14.5,s:2},
{id:'t5',c:'tacos',n:'Hongos',z:'Végétal & fumé',d:'Champignons rôtis, crème de cajou, épazote (×3)',p:11.5,s:0,v:1},
{id:'t6',c:'tacos',n:'Pescado Baja',z:'Style Ensenada',d:'Poisson pané, chou violet, crème chipotle (×3)',p:13,s:1},
{id:'a1',c:'antojitos',n:'Guacamole & totopos',z:'Minute',d:'Avocat écrasé à la commande, citron vert, piment serrano',p:8.5,s:1,v:1,sig:1},
{id:'a2',c:'antojitos',n:'Elote',z:'Maïs de rue',d:'Épi grillé, mayonnaise, cotija, poudre de piment',p:7,s:1,v:1},
{id:'a3',c:'antojitos',n:'Ceviche de dorade',z:'Tiger’s milk',d:'Dorade marinée, oignon rouge, mangue, habanero',p:11,s:2},
{id:'a4',c:'antojitos',n:'Nachos Cosecha',z:'À partager',d:'Totopos, haricots noirs, fromage fondu, jalapeños',p:10,s:2,v:1},
{id:'b1',c:'bowls',n:'Quesadilla Birria',z:'Culte',d:'Fromage Oaxaca, bœuf birria, consommé pour tremper',p:14,s:1,sig:0},
{id:'b2',c:'bowls',n:'Burrito Bowl Pibil',z:'Yucatán',d:'Poulet pibil, riz coriandre, haricots noirs, pico de gallo',p:14.5,s:1},
{id:'b3',c:'bowls',n:'Quesadilla Champi',z:'Végé',d:'Champignons, fleur de courgette, fromage fondu',p:12.5,s:0,v:1},
{id:'d1',c:'boissons',n:'Margarita Cosecha',z:'Signature',d:'Tequila blanco, triple sec, citron vert, sel fumé',p:11,s:0,v:1,sig:1},
{id:'d2',c:'boissons',n:'Mezcal Paloma',z:'Fumé',d:'Mezcal, pamplemousse rose, soda, sel de Colima',p:12,s:0,v:1},
{id:'d3',c:'boissons',n:'Horchata',z:'Sans alcool',d:'Riz, cannelle, vanille, glace pilée',p:5,s:0,v:1},
{id:'d4',c:'boissons',n:'Michelada',z:'Rafraîchissante',d:'Bière blonde, citron vert, sauce piquante, sel',p:8,s:1,v:1},
{id:'s1',c:'dessert',n:'Churros chocolat',z:'Chauds',d:'Sucre-cannelle, chocolat noir épicé',p:8.5,s:0,v:1},
{id:'s2',c:'dessert',n:'Flan vanille',z:'Maison',d:'Caramel brun, fleur de sel',p:7.5,s:0,v:1}];
window.U=(i,w=900)=>i.startsWith('http')?i:`https://images.unsplash.com/photo-${i}?auto=format&fit=crop&w=${w}&q=75`;
window.IM={"t1": "1599974579688-8dbdd335c77f", "t2": "1648437595587-e6a8b0cdf1f9", "t3": "1687881063470-a78e6ea2590e", "t4": "1690874684451-92358e91b14c", "t5": "1644085128237-9ba593123ac3", "t6": "1504544750208-dc0358e63f7f", "a1": "1711306722944-70b776bb4394", "b1": "1545092714-55b264ca417d"};DISHES.forEach(d=>d.img=IM[d.id]);
window.WOK={nm:'Tacos maison',vl:'Garnitures',base:[['3 tacos maïs',9,'1599974579688-8dbdd335c77f'],['3 tacos blé',9,'1644085128237-9ba593123ac3'],['Quesadilla',10.5,'1545092714-55b264ca417d'],['Bowl sans tortilla',10,'1613409385222-3d0decb6742a']],prot:[['Al pastor',3],['Poulet pibil',3],['Barbacoa de bœuf',4],['Gambas',5],['Champignons rôtis',2.5],['Sans viande',0]],sauce:[['Verde'],['Roja'],['Habanero'],['Chipotle'],['Macha'],['Guacamole']],veg:[['Oignon'],['Coriandre'],['Ananas'],['Radis'],['Chou violet'],['Citron vert'],['Avocat']],extra:[['Fromage cotija',1.5],['Crème acidulée',1],['Nopal grillé',1.5],['Haricots noirs',1]]};
window.QUOTES=[['« Les meilleures carnitas de Bruxelles, point. Tortillas pressées minute, on sent le maïs. »','Camille D.'],['« J’ai composé mes tacos en ligne, livrés brûlants en 20 minutes. Bluffant. »','Mehdi R.'],['« Une ambiance de cantina chic, un mezcal Paloma parfait et ce guacamole… »','Sophie L.'],['« La quesadilla birria avec son consommé : une claque. On revient chaque semaine. »','Antoine V.']];
window.GALLERY=[["1599974579688-8dbdd335c77f", "Al pastor", "4/5"], ["1504544750208-dc0358e63f7f", "Pescado Baja", "1/1"], ["1648437595587-e6a8b0cdf1f9", "Planche de tacos", "4/3"], ["1711306722944-70b776bb4394", "Guacamole minute", "4/3"], ["1690960681871-492aabd44a8e", "Citrons verts", "1/1"], ["1687881063470-a78e6ea2590e", "Carnitas", "4/5"], ["1690874684451-92358e91b14c", "Tacos et coriandre", "1/1"], ["1512838243191-e81e8f66f1fd", "Le plateau", "4/3"], ["1644085128237-9ba593123ac3", "Hongos", "4/5"]];
