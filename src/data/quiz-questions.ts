import type { QuizQuestion } from "@/types/quiz";

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // --- VANOISE ---
  {
    id: "v1",
    category: "vanoise",
    question: "Quelle est la plus haute montagne du Parc National de la Vanoise\u202f?",
    answers: [
      { id: "a", text: "La Grande Casse (3\u202f855\u202fm)" },
      { id: "b", text: "La Grande Motte (3\u202f653\u202fm)" },
      { id: "c", text: "Le Dôme de Chasseforêt (3\u202f586\u202fm)" },
      { id: "d", text: "La Pointe de Méan Martin (3\u202f330\u202fm)" },
    ],
    correctAnswerId: "a",
    funFact:
      "La Grande Casse culmine à 3\u202f855\u202fm et est le point culminant de la Savoie après le Mont Blanc.",
  },
  {
    id: "v2",
    category: "vanoise",
    question: "Le Parc National de la Vanoise a été créé en quelle année\u202f?",
    answers: [
      { id: "a", text: "1945" },
      { id: "b", text: "1963" },
      { id: "c", text: "1971" },
      { id: "d", text: "1958" },
    ],
    correctAnswerId: "b",
    funFact:
      "C'est le premier parc national créé en France, en 1963. Il protège notamment le bouquetin des Alpes.",
  },
  {
    id: "v3",
    category: "vanoise",
    question: "Quel animal est le symbole du Parc National de la Vanoise\u202f?",
    answers: [
      { id: "a", text: "Le chamois" },
      { id: "b", text: "Le loup" },
      { id: "c", text: "Le bouquetin" },
      { id: "d", text: "L'aigle royal" },
    ],
    correctAnswerId: "c",
    funFact:
      "La population de bouquetins de la Vanoise, quasi-éteinte au XIXe siècle, est passée de 40 individus en 1963 à plus de 2\u202f000 aujourd'hui.",
  },
  {
    id: "v4",
    category: "vanoise",
    question:
      "Combien de glaciers y a-t-il approximativement dans la Vanoise\u202f?",
    answers: [
      { id: "a", text: "12" },
      { id: "b", text: "43" },
      { id: "c", text: "107" },
      { id: "d", text: "200" },
    ],
    correctAnswerId: "c",
    funFact:
      "La Vanoise compte environ 107 glaciers, dont beaucoup reculent fortement depuis les années 1980 à cause du réchauffement climatique.",
  },
  {
    id: "v5",
    category: "vanoise",
    question:
      "Qu'est-ce que la «\u202fHaute Route\u202f» classique en ski de randonnée\u202f?",
    answers: [
      { id: "a", text: "Grenoble à Turin" },
      { id: "b", text: "Chamonix à Zermatt" },
      { id: "c", text: "Annecy à Genève" },
      { id: "d", text: "Val d'Isère à Tignes" },
    ],
    correctAnswerId: "b",
    funFact:
      "La Haute Route Chamonix-Zermatt est l'une des plus célèbres traversées alpines à ski, comptant environ 120\u202fkm et 12\u202f000\u202fm de dénivelé.",
  },
  {
    id: "v6",
    category: "vanoise",
    question:
      "À quelle altitude se trouve environ la limite de la forêt dans les Alpes françaises\u202f?",
    answers: [
      { id: "a", text: "1\u202f200\u202fm" },
      { id: "b", text: "1\u202f800\u202fm" },
      { id: "c", text: "2\u202f400\u202fm" },
      { id: "d", text: "3\u202f000\u202fm" },
    ],
    correctAnswerId: "b",
    funFact:
      "La timberline (limite des arbres) se situe vers 1\u202f800\u202fm dans les Alpes françaises, au-delà commence l'étage alpin.",
  },
  {
    id: "v7",
    category: "vanoise",
    question:
      "Le terme «\u202frandonné\u202f» dans «\u202fski de randonnée\u202f» vient du vieux français. Que signifie-t-il\u202f?",
    answers: [
      { id: "a", text: "Courir vite" },
      { id: "b", text: "Errer, vagabonder" },
      { id: "c", text: "Revenir au point de départ" },
      { id: "d", text: "Traverser la montagne" },
    ],
    correctAnswerId: "b",
    funFact:
      'Du vieux français "randonner" (errer, courir), qui a aussi donné "randonner" en anglais via le normand.',
  },
  {
    id: "v8",
    category: "vanoise",
    question:
      "Qu'est-ce qu'un «\u202frefuge gardé\u202f» en France\u202f?",
    answers: [
      { id: "a", text: "Un refuge avec un chien de garde" },
      { id: "b", text: "Un refuge avec gardien, ouvert, repas servis" },
      { id: "c", text: "Un refuge classé monument historique" },
      { id: "d", text: "Un refuge appartenant exclusivement au CAF" },
    ],
    correctAnswerId: "b",
    funFact:
      "En France, un refuge gardé dispose d'un gardien humain, propose des repas, des dortoirs, et est ouvert à la réservation. Profitez-en !",
  },
  {
    id: "v9",
    category: "vanoise",
    question:
      "Le ski de randonnée utilise des «\u202fpeaux de phoque\u202f». Pourquoi ce nom\u202f?",
    answers: [
      { id: "a", text: "Leur inventeur s'appelait M. Phoque" },
      { id: "b", text: "C'est un acronyme technique" },
      { id: "c", text: "La texture ressemble à la fourrure de phoque" },
      {
        id: "d",
        text: "Elles étaient historiquement faites de vraie peau de phoque",
      },
    ],
    correctAnswerId: "d",
    funFact:
      "Les premières peaux étaient effectivement fabriquées avec de la peau de phoque, dont les poils permettent la glisse en avant et bloquent en arrière. Aujourd'hui elles sont en mohair ou synthétique.",
  },
  {
    id: "v10",
    category: "vanoise",
    question:
      "Quelle vallée est un point de départ classique pour les tours de ski de randonnée en Vanoise\u202f?",
    answers: [
      { id: "a", text: "Vallée de la Tarentaise" },
      { id: "b", text: "Vallée de Chamonix" },
      { id: "c", text: "Vallée d'Aoste" },
      { id: "d", text: "Vallée du Grésivaudan" },
    ],
    correctAnswerId: "a",
    funFact:
      "La Tarentaise et la Maurienne encadrent le Parc de la Vanoise et sont les deux vallées d'accès principales pour les itinéraires de ski de rando.",
  },
  // --- TECHNIQUE ---
  {
    id: "te1",
    category: "technique",
    question: "DVA signifie\u202f:",
    answers: [
      { id: "a", text: "Détecteur de Vitesse d'Avalanche" },
      { id: "b", text: "Détecteur de Victimes d'Avalanche" },
      { id: "c", text: "Dispositif de Voie Alpine" },
      { id: "d", text: "Direction Valeur Altimétrique" },
    ],
    correctAnswerId: "b",
    funFact:
      "Le DVA (ou ARVA\u202f: Appareil de Recherche de Victimes en Avalanche) émet un signal radio qui permet de localiser une victime ensevelie.",
  },
  {
    id: "te2",
    category: "technique",
    question:
      "Quelle est la première chose à faire si ton équipier est emporté par une avalanche\u202f?",
    answers: [
      { id: "a", text: "Appeler le 112 immédiatement" },
      {
        id: "b",
        text: "Marquer le dernier point de vue et commencer la recherche DVA",
      },
      { id: "c", text: "Descendre chercher des secours" },
      {
        id: "d",
        text: "Attendre l'arrêt complet depuis un endroit sûr",
      },
    ],
    correctAnswerId: "b",
    funFact:
      "Les 15 premières minutes sont critiques. La recherche DVA doit commencer immédiatement par les survivants. Les secours sont alertés en parallèle.",
  },
  {
    id: "te3",
    category: "technique",
    question: "L'échelle européenne du risque d'avalanche va de\u202f:",
    answers: [
      { id: "a", text: "1 à 3" },
      { id: "b", text: "0 à 10" },
      { id: "c", text: "1 à 5" },
      { id: "d", text: "1 à 7" },
    ],
    correctAnswerId: "c",
    funFact:
      "L'échelle va de 1 (faible) à 5 (très fort). Le niveau 3 (marqué) est celui où la majorité des accidents mortels se produisent car les gens sous-estiment le danger.",
  },
  {
    id: "te4",
    category: "technique",
    question:
      "Le «\u202fdéclenchement à distance\u202f» d'une avalanche signifie\u202f:",
    answers: [
      { id: "a", text: "Déclencher depuis un hélicoptère" },
      {
        id: "b",
        text: "Déclencher une avalanche depuis une pente adjacente",
      },
      { id: "c", text: "Utiliser des explosifs télécommandés" },
      { id: "d", text: "Déclencher depuis le bas de la pente" },
    ],
    correctAnswerId: "b",
    funFact:
      "Le déclenchement à distance est particulièrement traître\u202f: tu peux déclencher une avalanche sur une pente voisine sans y être, simplement en passant à côté.",
  },
  {
    id: "te5",
    category: "technique",
    question:
      "Combien de temps peut survivre une personne ensevelie sous la neige en moyenne\u202f?",
    answers: [
      { id: "a", text: "5 minutes" },
      { id: "b", text: "15 minutes" },
      { id: "c", text: "45 minutes" },
      { id: "d", text: "2 heures" },
    ],
    correctAnswerId: "b",
    funFact:
      "Le taux de survie chute drastiquement après 15 minutes. Au-delà de 45 minutes, la survie est liée à la présence d'une poche d'air. D'où l'urgence absolue de la recherche immédiate.",
  },
  {
    id: "te6",
    category: "technique",
    question: "Quelle est la pente idéale pour les avalanches de plaque\u202f?",
    answers: [
      { id: "a", text: "10-20°" },
      { id: "b", text: "30-45°" },
      { id: "c", text: "50-60°" },
      { id: "d", text: "Plus de 70°" },
    ],
    correctAnswerId: "b",
    funFact:
      "Les avalanches de plaque se produisent surtout entre 30° et 45°. En dessous, la neige ne part pas. Au-dessus, elle ne s'accumule pas assez.",
  },
  {
    id: "te7",
    category: "technique",
    question:
      "Un bon rythme de marche en montée en ski de rando, c'est\u202f:",
    answers: [
      { id: "a", text: "Le plus vite possible pour se réchauffer" },
      { id: "b", text: "Lent et régulier, pouvoir tenir une conversation" },
      { id: "c", text: "Rapide avec des pauses fréquentes" },
      { id: "d", text: "Ça dépend uniquement de la météo" },
    ],
    correctAnswerId: "b",
    funFact:
      "En rando, l'allure doit permettre de parler sans s'essouffler. Trop vite = dette d'O₂ = obligé de s'arrêter. Le rythme lent et régulier est toujours plus rapide sur la durée.",
  },
  {
    id: "te8",
    category: "technique",
    question: "La «\u202ftechnique de godille\u202f» en ski, c'est\u202f:",
    answers: [
      {
        id: "a",
        text: "Des virages courts et rythmés dans l'axe de la pente",
      },
      { id: "b", text: "Skier en chasse-neige à grande vitesse" },
      { id: "c", text: "Une technique réservée aux compétiteurs" },
      { id: "d", text: "Freiner avec les bâtons" },
    ],
    correctAnswerId: "a",
    funFact:
      "La godille est la technique du skieur expert\u202f: des virages courts et symétriques enchaînés rapidement dans l'axe de la pente. Impossible à imiter après deux jours de peau.",
  },
  {
    id: "te9",
    category: "technique",
    question: "Que signifie «\u202fdéchausser ses skis\u202f» en rando\u202f?",
    answers: [
      { id: "a", text: "Enlever ses chaussures de ski" },
      {
        id: "b",
        text: "Retirer ses skis pour avancer à pied avec crampons",
      },
      { id: "c", text: "Desserrer les fixations pour plus de flexibilité" },
      { id: "d", text: "Changer de mode chaussure" },
    ],
    correctAnswerId: "b",
    funFact:
      "Dans les sections trop raides ou glacées, on «\u202fdéchausse\u202f» (on retire les skis) pour les porter sur le sac et avancer avec crampons et piolet.",
  },
  {
    id: "te10",
    category: "technique",
    question:
      "Quel est le rôle des fixations en mode «\u202frandonnée\u202f» vs «\u202fdescente\u202f»\u202f?",
    answers: [
      {
        id: "a",
        text: "En rando le talon est libre, en descente il est verrouillé",
      },
      {
        id: "b",
        text: "En rando on enlève la fixation arrière",
      },
      { id: "c", text: "C'est la même chose, on change juste la chaussure" },
      { id: "d", text: "En rando on n'utilise pas de fixations" },
    ],
    correctAnswerId: "a",
    funFact:
      "La fixation de rando libère le talon pour permettre la marche (comme une charnière). En descente, on verrouille le talon pour retrouver le comportement d'un ski alpin classique.",
  },
  // --- GROUPE ---
  {
    id: "gr1",
    category: "groupe",
    question:
      "Raph est le plus susceptible de dire quelle phrase le matin\u202f?",
    answers: [
      { id: "a", text: "«\u202fLa météo est parfaite, on y va !\u202f»" },
      { id: "b", text: "«\u202fC'est juste un peu physique\u202f»" },
      { id: "c", text: "«\u202fOn a le temps, pas de stress\u202f»" },
      { id: "d", text: "«\u202fJ'ai regardé la carte, il y a un raccourci\u202f»" },
    ],
    correctAnswerId: "b",
    funFact: "«\u202fC'est juste un peu physique\u202f» — avant 800m de dénivelé.",
  },
  {
    id: "gr2",
    category: "groupe",
    question:
      "Flix est le plus susceptible de faire quoi pendant la montée\u202f?",
    answers: [
      { id: "a", text: "Nommer tous les sommets environnants" },
      { id: "b", text: "Oublier quelque chose d'essentiel au refuge" },
      { id: "c", text: "Faire la cartographie du terrain" },
      { id: "d", text: "Commander du vin au sommet" },
    ],
    correctAnswerId: "b",
    funFact: "Flix et les oublis\u202f: une histoire d'amour.",
  },
  {
    id: "gr3",
    category: "groupe",
    question: "Si Hadri était un fromage savoyard, il/elle serait\u202f:",
    answers: [
      { id: "a", text: "Beaufort — noble et affiné" },
      { id: "b", text: "Vacherin — doux et coulant" },
      { id: "c", text: "Raclette — populaire et fondu" },
      { id: "d", text: "Reblochon — mystérieux" },
    ],
    correctAnswerId: "a",
    funFact: "Le Beaufort, roi des fromages de montagne. Noble.",
  },
  {
    id: "gr4",
    category: "groupe",
    question:
      "Emilililie a un prénom avec autant de lettres parce que\u202f:",
    answers: [
      { id: "a", text: "Ses parents aimaient la symétrie" },
      { id: "b", text: "C'est une erreur d'état civil devenue tradition" },
      { id: "c", text: "Elle l'a choisi elle-même à 5 ans" },
      { id: "d", text: "Mystère absolu" },
    ],
    correctAnswerId: "d",
    funFact: "Certains mystères ne seront jamais élucidés.",
  },
  {
    id: "gr5",
    category: "groupe",
    question:
      "Nico est le plus susceptible de trouver une solution créative quand\u202f:",
    answers: [
      { id: "a", text: "Il faut réparer un équipement cassé" },
      { id: "b", text: "Il faut choisir un vin" },
      { id: "c", text: "Il faut calculer le pourboire" },
      { id: "d", text: "Il faut expliquer l'itinéraire" },
    ],
    correctAnswerId: "a",
    funFact: "Nico et le bricolage de terrain\u202f: inarrêtable.",
  },
  {
    id: "gr6",
    category: "groupe",
    question:
      "Chose (le développeur de cette app) l'a créée parce que\u202f:",
    answers: [
      { id: "a", text: "Il voulait impressionner Raph" },
      { id: "b", text: "Pari perdu" },
      { id: "c", text: "Il s'ennuyait et c'était ça ou apprendre à skier" },
      { id: "d", text: "Il est développeur dans l'âme et ne peut pas s'en empêcher" },
    ],
    correctAnswerId: "d",
    funFact: "Là maintenant, tu joues à un jeu fait par Chose. Respect.",
  },
  {
    id: "gr7",
    category: "groupe",
    question:
      "Qui dans le groupe est le plus susceptible d'être encore debout à minuit au refuge\u202f?",
    answers: [
      { id: "a", text: "Flix" },
      { id: "b", text: "Emilililie" },
      { id: "c", text: "Nico" },
      { id: "d", text: "Momo" },
    ],
    correctAnswerId: "b",
    funFact: "Le groupe vote. La réponse officielle peut varier.",
  },
  {
    id: "gr8",
    category: "groupe",
    question:
      "La vraie raison pour laquelle on fait ce trip en Vanoise et pas à Chamonix\u202f:",
    answers: [
      { id: "a", text: "Chamonix c'est trop touristique" },
      { id: "b", text: "Raph connaît la gardienne d'un refuge" },
      { id: "c", text: "Le prix des forfaits" },
      { id: "d", text: "Raph a décidé et on ne discute pas avec Raph" },
    ],
    correctAnswerId: "d",
    funFact: "On ne discute pas avec le guide. C'est la règle.",
  },
  {
    id: "gr9",
    category: "groupe",
    question:
      "Si le groupe devait choisir une mascotte animale de la Vanoise, ce serait\u202f:",
    answers: [
      { id: "a", text: "Le bouquetin — majestueux mais têtu" },
      { id: "b", text: "Le chamois — agile mais stressé" },
      { id: "c", text: "La marmotte — adorable et toujours en train de dormir" },
      { id: "d", text: "L'aigle — arrive en dernier mais avec classe" },
    ],
    correctAnswerId: "a",
    funFact: "Le bouquetin\u202f: symbole de la Vanoise et du groupe.",
  },
  {
    id: "gr10",
    category: "groupe",
    question:
      "Momo est le plus susceptible de\u202f:",
    answers: [
      { id: "a", text: "Apporter le snack le plus improbable" },
      { id: "b", text: "Faire une sieste au sommet" },
      { id: "c", text: "Connaître le nom latin de chaque plante alpine" },
      { id: "d", text: "Perdre ses lunettes dans la neige" },
    ],
    correctAnswerId: "a",
    funFact: "Momo et les snacks\u202f: attendez-vous à des surprises.",
  },
];
