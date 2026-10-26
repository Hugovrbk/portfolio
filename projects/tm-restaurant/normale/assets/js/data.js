window.CATS=[['all','Tout'],['entree','Entrées'],['wok','Woks'],['nouilles','Nouilles & Riz'],['grill','Laqués & Vapeur'],['dessert','Desserts']];
window.DISHES=[
{id:'d1',c:'entree',n:'Raviolis Jiaozi grillés',z:'煎饺',d:'Porc, chou chinois, gingembre, sauce vinaigre noir',p:9.5,s:0,sig:1},
{id:'d2',c:'entree',n:'Nems croustillants',z:'春卷',d:'Crevettes, vermicelles, menthe, sauce nuoc-mâm douce',p:8.5,s:0},
{id:'d3',c:'entree',n:'Salade de concombre pimentée',z:'拍黄瓜',d:'Concombre écrasé, ail, huile de piment, sésame',p:7,s:2,v:1},
{id:'d4',c:'entree',n:'Soupe Hot & Sour',z:'酸辣汤',d:'Tofu soyeux, champignons noirs, œuf, poivre blanc',p:8,s:2},
{id:'d5',c:'wok',n:'Poulet Kung Pao',z:'宫保鸡丁',d:'Cacahuètes, piments séchés, poivre du Sichuan',p:17.5,s:2,sig:1},
{id:'d6',c:'wok',n:'Bœuf sauce huître',z:'蚝油牛肉',d:'Bœuf tendre, brocoli, ail, sauté à très haute température',p:19,s:1,sig:1},
{id:'d7',c:'wok',n:'Crevettes sel & poivre',z:'椒盐虾',d:'Gambas croquantes, piment vert, ail frit',p:21,s:2},
{id:'d8',c:'wok',n:'Mapo Tofu',z:'麻婆豆腐',d:'Tofu, porc haché, fèves pimentées, poivre Sichuan mala',p:16,s:3},
{id:'d9',c:'wok',n:'Légumes sautés au wok',z:'炒时蔬',d:'Pak choï, champignons, pousses de bambou, ail',p:14,s:0,v:1},
{id:'d10',c:'nouilles',n:'Chow Mein au poulet',z:'鸡肉炒面',d:'Nouilles sautées, pousses de soja, oignon vert',p:15,s:0,sig:1},
{id:'d11',c:'nouilles',n:'Dan Dan Noodles',z:'担担面',d:'Sauce sésame-piment, porc, légumes marinés',p:15.5,s:3},
{id:'d12',c:'nouilles',n:'Riz cantonais',z:'扬州炒饭',d:'Œuf, jambon, crevettes, petits pois',p:13,s:0},
{id:'d13',c:'grill',n:'Canard laqué (demi)',z:'北京烤鸭',d:'Crêpes, concombre, oignon nouveau, sauce hoisin',p:29,s:0},
{id:'d14',c:'grill',n:'Bao vapeur au porc',z:'叉烧包',d:'Pain moelleux, porc laqué char siu (3 pièces)',p:10,s:0},
{id:'d15',c:'dessert',n:'Perles de coco-mangue',z:'杨枝甘露',d:'Mangue, pamplemousse, perles de tapioca',p:8,s:0,v:1},
{id:'d16',c:'dessert',n:'Mochi glacés',z:'麻糬',d:'Thé matcha, sésame noir, litchi',p:7.5,s:0,v:1}];
window.U=(i,w=900)=>i.startsWith('http')?i:`https://images.unsplash.com/photo-${i}?auto=format&fit=crop&w=${w}&q=75`;
window.IM={"d1": "https://unsplash.com/photos/GZe_M6TUJ_k/download?force=true&w=900", "d5": "1707056503922-91c9ebaf0774", "d6": "1634141613544-001d33883517", "d9": "1601226809816-b8c32440158a", "d10": "1564834724105-918b73d1b9e0", "d12": "1512058564366-18510be2db19"};DISHES.forEach(d=>d.img=IM[d.id]);
window.WOK={nm:'Wok maison',vl:'Légumes',base:[['Nouilles de blé',10,'1564834724105-918b73d1b9e0'],['Riz sauté',9.5,'1512058564366-18510be2db19'],['Nouilles de riz',10.5,'1695606452836-c3c6e62d407b'],['Vermicelles',10,'1608393189287-0bc2191c7e86']],prot:[['Poulet',3],['Bœuf',4],['Crevettes',5],['Tofu fumé',2.5],['Canard laqué',5.5],['Sans viande',0]],sauce:[['Soja-gingembre'],['Mala Sichuan'],['Aigre-douce'],['Satay'],['Huître-ail'],['Teriyaki']],veg:[['Pak choï'],['Brocoli'],['Poivron'],['Champignons'],['Maïs bébé'],['Carotte'],['Oignon vert']],extra:[['Œuf frit',1.5],['Cacahuètes',1],['Kimchi',1.5],['Coriandre',.5]]};
window.QUOTES=[['« Le wok hei est incroyable : on sent le caractère de chaque bouchée. Le meilleur Kung Pao de Bruxelles. »','Camille D.'],['« J’ai composé mon propre wok en ligne, reçu en 20 minutes, brûlant et parfait. »','Mehdi R.'],['« Une ambiance de rue de Chengdu, des lanternes, une vraie énergie… Et le canard laqué, wow. »','Sophie L.'],['« Le Mapo Tofu m’a fait pleurer de bonheur. Respect pour la brigade. »','Antoine V.']];
window.GALLERY=[["1464500542410-1396074bf230", "Le wok", "4/5"], ["1464500650248-1a4b45debb9f", "Le geste", "1/1"], ["1512058564366-18510be2db19", "Riz sauté", "4/3"], ["1683624328172-88fb24625ec1", "La brigade", "4/3"], ["1601226809816-b8c32440158a", "Légumes du jour", "1/1"], ["1707056503922-91c9ebaf0774", "Sauté de bœuf", "4/5"], ["1564834724105-918b73d1b9e0", "Nouilles", "1/1"], ["1683621284476-549af8467c8d", "En cuisine", "4/3"], ["1683556262029-56f31fbf75ee", "Mise en place", "4/5"]];
