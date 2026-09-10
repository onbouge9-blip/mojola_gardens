// MOJOLA GARDENS — catalogue produits (source pour le panneau Stock du tableau de bord)
// Les noms doivent être EXACTEMENT identiques aux attributs data-name utilisés
// dans menu.html et commande.html, sous peine de désynchroniser le stock.

const MOJOLA_CATALOG = [
  { category: 'Mises en bouche', items: ['Samoussa (lot de 5)', 'Nems (lot de 5)', 'Mini brochettes (lot de 5)', 'Chicken wings (500g)'] },
  { category: 'Salades', items: ['Salade Composée Vegee', 'Salade Composée Classique', 'Salade Composée Spéciale', "Salade d'avocat", 'Salade du Chef'] },
  { category: 'Wraps & Burgers', items: ['Wrap Single', 'Wrap Vegee', 'Wrap Poulet', 'Wrap de Bœuf', 'Wrap de Poisson', 'Burger Single', 'Classic Burger', 'Vegee Burger'] },
  { category: 'Pizzas', items: ['Pizza Margarita', 'Pizza Végétarienne', 'Pizza Caprese Peulh', 'Pizza Regina', 'Pizza Suprême Poulet Mexicaine', 'Pizza Hawaïenne', 'Pizza Buffalo', 'Pizza Périgourdine', 'Pizza 4 Fromages', 'Pizza Gambas'] },
  { category: 'Grillades', items: ['Choukouya de poulet', 'Choukouya de Pintade', 'Choukouya de Lapin', 'Choukouya de Cabri', "Choukouya d'Escargot", 'Grande brochette', 'Braisé au choix (Bar/Tilapia/Sole/Poulet/Mouton)', 'Braisé au choix (Pintade/Lapin 1/2)'] },
  { category: 'Plateaux Partage', items: ['Brochetti', 'Mabawa', 'Partage poulet choukouya', 'Partage cabri choukouya', 'Partage pintade choukouya', 'Partage lapin choukouya', 'Partage Mojola Classique', 'Partage Mojola Spécial'] },
  { category: 'Garnitures', items: ['Garniture — Riz coco curcuma / Riz blanc', 'Garniture — Amiwo/Bomiwo/Piron', 'Garniture — Attiéké/Alloco/Frite', 'Garniture — Pomme de terre sautée', 'Garniture — Légumes sautées'] },
  { category: 'Jus', items: ['Jus Orange', 'Jus Ananas', 'Pastèque pressée', 'Jus Gingembre', 'Bissap', 'Antioxydant', 'Antigripal', 'Verdé', 'Menta', 'Papaya', 'Banana', 'Mango', 'Pina colada (jus)', 'Manzana', 'Fresa'] },
  { category: 'Yaourts & Dègués', items: ['Yaourt nature', 'Yaourt gourmand choco coco', 'Dègué tradi mil', 'Dègué tradi blé', 'Dègué mil/blé vanille', 'Dègué mil/blé chocolat', 'Dègué mil/blé Caramel', 'Milk shake'] },
  { category: 'Thés', items: ['Thé glacé', 'Thé mojito', 'Thé citronnelle au miel'] },
  { category: 'Mocktails', items: ['Bora bora', 'Virgin mojola', 'Virgin mojito', 'Rollier', 'Abricot frappé'] },
  { category: 'Cocktails', items: ['Sangria', 'Planteur', 'Mojito classic', 'Pina colada (cocktail)', 'Blue lagoon', 'Blue hawaï', 'Caïpiroska', 'Mojola hot', 'Paradise', 'Tequila sunrise', 'Margarita', 'Cupa libre', 'Bring me', 'Americano', 'Negroni'] },
  { category: 'Shooters', items: ['Shooter mix barre de 3', 'Shooter mix barre de 7', 'Shot sodabi arrangé barre de 2'] },
  { category: 'Boissons', items: ['Awoyo 50cl', 'Beaufort 33cl', 'Béninoise 33cl', 'Castel 50cl', 'Desparado 33cl', 'Doppel 33cl', 'Doppel 50cl', 'Eku 33cl', 'Flag 50cl', 'Guiness 33cl', 'Heinekein', 'Pils 33cl', 'Racine booster 50cl', 'Téquila booster 33cl', 'XXL 33cl', 'Coca-cola 33cl', 'Cocktail de fruits 33cl', 'Moka 33cl', 'Pamplemousse 33cl', 'Panaché 33cl', 'Sprite 33cl', 'Contesse 1L', 'Fifa 1,5L', 'Kwabo 1L'] }
];

window.MOJOLA_CATALOG = MOJOLA_CATALOG;
