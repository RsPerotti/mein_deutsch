/**
 * GRAMMAR-DATA.JS — Bundled grammar lesson data
 * Generated from data/grammar/lessons.json
 * Do not edit directly — edit lessons.json and regenerate.
 */

window.GRAMMAR_DATA = [
  {
    "id": "verb-basics",
    "title": "Verb Basics",
    "order": 1,
    "unlocks": [],
    "sections": [
      {
        "type": "explanation",
        "heading": "What is a verb?",
        "body": "Verbs are the engine of every sentence — they express what is happening, what exists, or what someone experiences. In German, verbs appear in the dictionary in their infinitive form, which almost always ends in -en.",
        "example_de": "lernen, gehen, haben, sein",
        "example_en": "to learn, to go, to have, to be"
      },
      {
        "type": "explanation",
        "heading": "Verb position in a sentence",
        "body": "In a German main clause, the verb always occupies the second position — no matter what comes first. This is called the V2 rule and it is one of the most fundamental rules of German syntax.",
        "example_de": "Ich lerne Deutsch. / Deutsch lerne ich.",
        "example_en": "I learn German. / German I learn. (verb stays second)"
      },
      {
        "type": "explanation",
        "heading": "Subject–verb agreement",
        "body": "The verb must change its ending to match the subject. Each person (I, you, he/she/it, we, you all, they) has a different verb ending. This process is called conjugation.",
        "example_de": "ich lerne · du lernst · er/sie/es lernt · wir lernen · ihr lernt · sie lernen",
        "example_en": "I learn · you learn · he/she/it learns · we learn · you (pl.) learn · they learn"
      }
    ],
    "key_rules": [
      "Verbs express actions, states, or processes.",
      "The infinitive form almost always ends in -en (lernen, gehen, haben).",
      "In a German main clause, the verb always occupies the second position (V2 rule).",
      "The verb ending changes to match the subject — this is conjugation.",
      "Two irregular verbs to memorise early: sein (to be) and haben (to have)."
    ],
    "quiz": [
      {
        "type": "rule_check",
        "question": "In a German main clause, which position does the conjugated verb always occupy?",
        "options": [
          "First position",
          "Second position",
          "Third position",
          "Last position"
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "Which ending does the German infinitive almost always have?",
        "options": [
          "-t",
          "-st",
          "-en",
          "-e"
        ],
        "correct": 2
      },
      {
        "type": "rule_check",
        "question": "What is it called when a verb changes its ending to match the subject?",
        "options": [
          "Declension",
          "Conjugation",
          "Inflection",
          "Agreement"
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "Which sentence is correct? (verb must be in second position)",
        "options": [
          "Deutsch ich lerne.",
          "Ich lerne Deutsch.",
          "Ich Deutsch lerne.",
          "Lerne ich Deutsch."
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "Which of these is a German infinitive form?",
        "options": [
          "lernst",
          "lernt",
          "lernen",
          "lerne"
        ],
        "correct": 2
      }
    ]
  },
  {
    "id": "regular-conjugation",
    "title": "Regular Conjugation (Präsens)",
    "order": 2,
    "unlocks": [
      "stammverben-prasens"
    ],
    "sections": [
      {
        "type": "explanation",
        "heading": "Finding the stem",
        "body": "To conjugate a regular verb in the present tense, start by removing the -en ending from the infinitive. What remains is the verb stem. You then add the correct personal ending to the stem.",
        "example_de": "lernen → lern- (stem)",
        "example_en": "to learn → learn- (stem)"
      },
      {
        "type": "explanation",
        "heading": "The six personal endings",
        "body": "Regular verbs in the present tense follow a predictable set of endings. These six endings apply to all regular verbs — once you learn them, you can conjugate hundreds of verbs.",
        "example_de": "ich lerne · du lernst · er/sie/es lernt · wir lernen · ihr lernt · sie/Sie lernen",
        "example_en": "-e · -st · -t · -en · -t · -en"
      },
      {
        "type": "explanation",
        "heading": "Spelling adjustment: -t and -d stems",
        "body": "When the verb stem ends in -t or -d, an extra -e- is inserted before endings that start with a consonant. This makes the word easier to pronounce.",
        "example_de": "arbeiten → du arbeitest (not *arbeitst) · warten → er wartet (not *wartt)",
        "example_en": "to work → you work · to wait → he waits"
      }
    ],
    "key_rules": [
      "Remove -en from the infinitive to get the stem (lernen → lern-).",
      "Add the ending: -e (ich), -st (du), -t (er/sie/es), -en (wir), -t (ihr), -en (sie/Sie).",
      "Stems ending in -t or -d insert an extra -e- before consonant endings (arbeiten → arbeitest).",
      "Stems ending in -s, -ss, -ß, or -z: the du-form ends in -t not -st (heißen → du heißt).",
      "wir and sie/Sie forms always match the infinitive (lernen → wir lernen)."
    ],
    "quiz": [
      {
        "type": "rule_check",
        "question": "What is the first step to conjugate a regular verb in the present tense?",
        "options": [
          "Add -en to the verb",
          "Remove -en to find the stem",
          "Look up the irregular form",
          "Add the prefix ge-"
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "What is the correct du-form of 'lernen'?",
        "options": [
          "du lerne",
          "du lernt",
          "du lernst",
          "du lernen"
        ],
        "correct": 2
      },
      {
        "type": "rule_check",
        "question": "Why is the correct form 'du arbeitest' and not 'du arbeitst'?",
        "options": [
          "arbeiten is irregular",
          "The stem ends in -t, so an extra -e- is inserted",
          "du always takes the -est ending",
          "It is an exception with no rule"
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "Which ending does 'er/sie/es' always take with a regular verb?",
        "options": [
          "-e",
          "-st",
          "-t",
          "-en"
        ],
        "correct": 2
      },
      {
        "type": "rule_check",
        "question": "The verb 'heißen' (to be called) has a stem ending in -ß. What is the correct du-form?",
        "options": [
          "du heißst",
          "du heißest",
          "du heißt",
          "du heißen"
        ],
        "correct": 2
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_lernen_conjugation_table_prasens"
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_machen_conjugation_table_prasens"
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_arbeiten_conjugation_table_prasens"
      }
    ]
  },
  {
    "id": "trennbare-verben",
    "title": "Trennbare Verben",
    "order": 3,
    "unlocks": [
      "variationen"
    ],
    "sections": [
      {
        "type": "explanation",
        "heading": "What are separable verbs?",
        "body": "Separable verbs (trennbare Verben) are formed by adding a prefix to a base verb. The prefix carries its own meaning and, in a main clause, splits off and moves to the very end of the sentence.",
        "example_de": "anrufen → Ich rufe dich an.",
        "example_en": "to call (up) → I call you up. (prefix 'an' goes to the end)"
      },
      {
        "type": "explanation",
        "heading": "Common separable prefixes",
        "body": "The most frequent separable prefixes are: an-, auf-, aus-, ein-, mit-, nach-, vor-, zu-, ab-, zurück-. Inseparable prefixes (be-, ge-, er-, ver-, ent-, emp-, miss-, zer-) never split off.",
        "example_de": "aufmachen → Ich mache die Tür auf. / verstehen → Ich verstehe das. (no split)",
        "example_en": "to open → I open the door. / to understand → I understand it."
      },
      {
        "type": "explanation",
        "heading": "Prefix position in different sentence types",
        "body": "In a main clause the prefix goes to the end. In an infinitive construction (with modal verbs or zu) the verb stays together. In subordinate clauses the whole verb moves to the end, unseparated.",
        "example_de": "Ich rufe an. · Ich muss anrufen. · ..., weil ich anrufe.",
        "example_en": "I call. · I must call. · ..., because I call."
      }
    ],
    "key_rules": [
      "Separable verbs have a prefix that splits off in a main clause and moves to the end.",
      "Common separable prefixes: an-, auf-, aus-, ein-, mit-, nach-, vor-, zu-, ab-, zurück-.",
      "Inseparable prefixes (be-, ge-, er-, ver-, ent-, etc.) never split off.",
      "The base verb is still conjugated normally in second position; only the prefix moves.",
      "In infinitive and subordinate-clause forms, the verb stays together."
    ],
    "quiz": [
      {
        "type": "rule_check",
        "question": "In a German main clause, where does the separable prefix go?",
        "options": [
          "Stays attached to the verb",
          "Goes to the very end of the sentence",
          "Goes to the beginning",
          "Goes after the subject"
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "Which of these is a separable prefix?",
        "options": [
          "be-",
          "ver-",
          "auf-",
          "ge-"
        ],
        "correct": 2
      },
      {
        "type": "rule_check",
        "question": "Which sentence correctly uses the separable verb 'aufmachen' (to open)?",
        "options": [
          "Ich aufmache die Tür.",
          "Ich mache die Tür auf.",
          "Ich die Tür mache auf.",
          "Aufich mache die Tür."
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "The prefix 'ver-' is inseparable. What does this mean?",
        "options": [
          "It always goes to the end of the sentence",
          "It never splits off from the verb",
          "It can only be used with motion verbs",
          "It changes the meaning to the opposite"
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "How do you say 'I must call' using 'anrufen'?",
        "options": [
          "Ich muss anrufen.",
          "Ich muss rufen an.",
          "Ich muss an rufen.",
          "Ich anmuss rufen."
        ],
        "correct": 0
      }
    ]
  },
  {
    "id": "modal-verben",
    "title": "Modal Verben",
    "order": 4,
    "unlocks": [
      "modal-prasens"
    ],
    "sections": [
      {
        "type": "explanation",
        "heading": "The six modal verbs",
        "body": "Modal verbs modify the meaning of the main verb — they express ability, permission, necessity, desire, or obligation. The six German modals are: können (can/be able to), müssen (must/have to), dürfen (may/be allowed to), wollen (want to), sollen (should/be supposed to), mögen (like/may).",
        "example_de": "Ich kann schwimmen. · Du musst lernen. · Er darf gehen.",
        "example_en": "I can swim. · You must study. · He may go."
      },
      {
        "type": "explanation",
        "heading": "Modal verb sentence structure",
        "body": "A modal verb occupies the second position (conjugated) while the main verb goes to the end of the sentence in its infinitive form — no zu needed.",
        "example_de": "Ich will Deutsch lernen.",
        "example_en": "I want to learn German. (no 'zu' before lernen)"
      },
      {
        "type": "explanation",
        "heading": "Conjugation pattern",
        "body": "All modals share an irregular pattern: the ich and er/sie/es forms have the same ending (no -e / no -t), and the stem vowel often changes between singular and plural forms.",
        "example_de": "ich kann · du kannst · er kann · wir können · ihr könnt · sie können",
        "example_en": "Modal vowel changes: kann/können, muss/müssen, darf/dürfen, will/wollen"
      }
    ],
    "key_rules": [
      "There are six modal verbs: können, müssen, dürfen, wollen, sollen, mögen.",
      "Modal verbs occupy second position (conjugated); the main verb goes to the end as an infinitive.",
      "No 'zu' between the modal verb and the main verb infinitive.",
      "ich and er/sie/es forms are identical for all modals (ich kann / er kann).",
      "The stem vowel often differs between singular (kann) and plural (können)."
    ],
    "quiz": [
      {
        "type": "rule_check",
        "question": "Where does the main verb go when a modal verb is used?",
        "options": [
          "Second position, conjugated",
          "First position",
          "End of the sentence, as an infinitive",
          "Directly after the modal, with 'zu'"
        ],
        "correct": 2
      },
      {
        "type": "rule_check",
        "question": "Which sentence is correct?",
        "options": [
          "Ich will zu lernen Deutsch.",
          "Ich will Deutsch lernen.",
          "Ich will lerne Deutsch.",
          "Ich lernen will Deutsch."
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "Which modal verb expresses 'to be allowed to' (permission)?",
        "options": [
          "müssen",
          "wollen",
          "sollen",
          "dürfen"
        ],
        "correct": 3
      },
      {
        "type": "rule_check",
        "question": "What is the er/sie/es form of 'können'?",
        "options": [
          "er könnt",
          "er kannen",
          "er kann",
          "er könnet"
        ],
        "correct": 2
      },
      {
        "type": "rule_check",
        "question": "Which modal verb expresses necessity or obligation ('must/have to')?",
        "options": [
          "mögen",
          "sollen",
          "müssen",
          "dürfen"
        ],
        "correct": 2
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_können_conjugation_table_prasens"
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_müssen_conjugation_table_prasens"
      }
    ]
  },
  {
    "id": "vergangenheit-perfekt",
    "title": "Vergangenheit — Perfekt",
    "order": 5,
    "unlocks": [
      "perfekt"
    ],
    "sections": [
      {
        "type": "explanation",
        "heading": "When to use Perfekt",
        "body": "Perfekt is the most common way to talk about the past in spoken German. It is formed with an auxiliary verb (haben or sein) in second position plus the Partizip II at the end of the sentence.",
        "example_de": "Ich habe Deutsch gelernt. · Sie ist nach Berlin gefahren.",
        "example_en": "I have learned German. · She has gone to Berlin."
      },
      {
        "type": "explanation",
        "heading": "Choosing haben or sein",
        "body": "Most verbs take haben. Sein is used with verbs of motion that move from A to B (fahren, gehen, kommen, fliegen, laufen) and verbs of change of state (werden, wachsen, einschlafen). The verb sein itself and bleiben also take sein.",
        "example_de": "Ich habe gegessen. (bleiben in place) · Ich bin gegangen. (motion A→B)",
        "example_en": "I have eaten. (no movement) · I have gone. (movement)"
      },
      {
        "type": "explanation",
        "heading": "Forming the Partizip II",
        "body": "Regular (weak) verbs: ge- + stem + -t (lernen → gelernt, kaufen → gekauft). Irregular (strong) verbs have their own forms, often with a vowel change (fahren → gefahren, schreiben → geschrieben). Verbs with inseparable prefixes or ending in -ieren do not take ge- (verstehen → verstanden, studieren → studiert).",
        "example_de": "lernen → gelernt · fahren → gefahren · verstehen → verstanden · studieren → studiert",
        "example_en": "regular · irregular · inseparable prefix (no ge-) · -ieren verb (no ge-)"
      }
    ],
    "key_rules": [
      "Perfekt = auxiliary (haben / sein) in second position + Partizip II at the end.",
      "Most verbs take haben; verbs of motion (A→B) and change of state take sein.",
      "Regular Partizip II: ge- + stem + -t (lernen → gelernt).",
      "Irregular Partizip II: must be memorised (fahren → gefahren, schreiben → geschrieben).",
      "Verbs with inseparable prefixes (be-, ver-, etc.) and -ieren verbs do not add ge-."
    ],
    "quiz": [
      {
        "type": "rule_check",
        "question": "How is Perfekt formed?",
        "options": [
          "Auxiliary verb at the end + Partizip II in second position",
          "Conjugated auxiliary in second position + Partizip II at the end",
          "Only the Partizip II form of the verb, no auxiliary",
          "Modal verb + infinitive"
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "Which auxiliary does 'gehen' (to go — motion A→B) use in Perfekt?",
        "options": [
          "haben",
          "sein",
          "werden",
          "dürfen"
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "What is the Partizip II of the regular verb 'lernen'?",
        "options": [
          "gelernst",
          "lerngte",
          "gelernt",
          "gelearnt"
        ],
        "correct": 2
      },
      {
        "type": "rule_check",
        "question": "Why does 'studieren' form 'studiert' (not 'gestudiert') in Partizip II?",
        "options": [
          "It is an irregular verb",
          "Verbs ending in -ieren do not add ge-",
          "It takes sein as auxiliary",
          "The prefix already contains ge-"
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "Which sentence is correct Perfekt for 'Sie / essen' (she ate)?",
        "options": [
          "Sie ist gegessen.",
          "Sie hat gegessen.",
          "Sie hat essen.",
          "Sie ist essen gegangen."
        ],
        "correct": 1
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_lernen_partizip_ii"
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_fahren_partizip_ii"
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_lernen_auxiliary_choice"
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_gehen_auxiliary_choice"
      }
    ]
  },
  {
    "id": "vergangenheit-prateritum",
    "title": "Vergangenheit — Präteritum",
    "order": 6,
    "unlocks": [
      "prateritum"
    ],
    "sections": [
      {
        "type": "explanation",
        "heading": "When to use Präteritum",
        "body": "Präteritum (simple past) is used mainly in written German — novels, news, formal reports. In everyday speech, most verbs use Perfekt instead. However, the modals (war, hatte, konnte, musste, durfte, wollte, sollte, mochte) are almost always used in Präteritum even in speech.",
        "example_de": "Er war müde. · Ich hatte keine Zeit. · Wir mussten warten.",
        "example_en": "He was tired. · I had no time. · We had to wait."
      },
      {
        "type": "explanation",
        "heading": "Regular Präteritum endings",
        "body": "Regular (weak) verbs add -te to the stem, then the personal ending. The ich and er/sie/es forms have no additional ending after -te.",
        "example_de": "lernen: ich lernte · du lerntest · er lernte · wir lernten · ihr lerntet · sie lernten",
        "example_en": "stem + -te + ending (ich/er: no extra ending)"
      },
      {
        "type": "explanation",
        "heading": "Irregular Präteritum (strong verbs)",
        "body": "Strong (irregular) verbs change their stem vowel in Präteritum. The ich and er/sie/es forms have no ending. The endings for du, wir, ihr, sie are the same as regular verbs (-st, -en, -t, -en). These forms must be memorised.",
        "example_de": "fahren → fuhr: ich fuhr · du fuhrst · er fuhr · wir fuhren · ihr fuhrt · sie fuhren",
        "example_en": "irregular vowel change (a → u) — stem must be memorised"
      }
    ],
    "key_rules": [
      "Präteritum is the written past tense; modals and sein/haben use it in speech too.",
      "Regular verbs: stem + -te + ending (ich lernte, du lerntest, er lernte).",
      "Irregular verbs change their stem vowel — these must be memorised (fahren → fuhr).",
      "The ich and er/sie/es forms are identical in both regular and irregular Präteritum.",
      "Modals in Präteritum: war, hatte, konnte, musste, durfte, wollte, sollte, mochte."
    ],
    "quiz": [
      {
        "type": "rule_check",
        "question": "In which register is Präteritum most commonly used?",
        "options": [
          "Spoken everyday German",
          "Written German (novels, news, reports)",
          "Only formal speech",
          "Only questions"
        ],
        "correct": 1
      },
      {
        "type": "rule_check",
        "question": "What is the ich-form of the regular verb 'lernen' in Präteritum?",
        "options": [
          "ich gelernst",
          "ich lernete",
          "ich lernte",
          "ich lerntest"
        ],
        "correct": 2
      },
      {
        "type": "rule_check",
        "question": "In Präteritum, which forms of a verb (regular or irregular) have NO personal ending after the stem?",
        "options": [
          "du and ihr",
          "wir and sie",
          "ich and er/sie/es",
          "All forms have an ending"
        ],
        "correct": 2
      },
      {
        "type": "rule_check",
        "question": "The verb 'fahren' becomes 'fuhr' in Präteritum. What type of change is this?",
        "options": [
          "Adding -te to the stem",
          "Adding a separable prefix",
          "An irregular stem vowel change (strong verb)",
          "Removing the -en ending"
        ],
        "correct": 2
      },
      {
        "type": "rule_check",
        "question": "Which is the correct Präteritum of 'sein' (to be) for ich?",
        "options": [
          "ich seinte",
          "ich geseint",
          "ich hatte",
          "ich war"
        ],
        "correct": 3
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_lernen_conjugation_table_prateritum"
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_fahren_conjugation_table_prateritum"
      }
    ]
  }
];
