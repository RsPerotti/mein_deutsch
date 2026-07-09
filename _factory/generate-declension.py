#!/usr/bin/env python3
"""Generate exercises-declension.json.

Design (see declension-spec.md):
- Endings are NEVER hand-written. They are computed from TABLE, the single
  source of truth (pattern x case x gender). Sentences contain an article
  slot; the correct ending fills the blank at check time.
- Weak + mixed share 30 curated (adjective, noun, frames) pairs — only the
  article differs. Strong has its own 30 pairs (mass/abstract nouns +
  bare plurals), since count-noun singulars are ungrammatical without
  an article.
- Volume: 3 patterns x 4 cases x 30 = 360.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

TABLE = {
    ("schwach", "nominativ"): {"m": "e",  "f": "e",  "n": "e",  "pl": "en"},
    ("schwach", "akkusativ"): {"m": "en", "f": "e",  "n": "e",  "pl": "en"},
    ("schwach", "dativ"):     {"m": "en", "f": "en", "n": "en", "pl": "en"},
    ("schwach", "genitiv"):   {"m": "en", "f": "en", "n": "en", "pl": "en"},
    ("gemischt", "nominativ"): {"m": "er", "f": "e",  "n": "es", "pl": "en"},
    ("gemischt", "akkusativ"): {"m": "en", "f": "e",  "n": "es", "pl": "en"},
    ("gemischt", "dativ"):     {"m": "en", "f": "en", "n": "en", "pl": "en"},
    ("gemischt", "genitiv"):   {"m": "en", "f": "en", "n": "en", "pl": "en"},
    ("stark", "nominativ"): {"m": "er", "f": "e",  "n": "es", "pl": "e"},
    ("stark", "akkusativ"): {"m": "en", "f": "e",  "n": "es", "pl": "e"},
    ("stark", "dativ"):     {"m": "em", "f": "er", "n": "em", "pl": "en"},
    ("stark", "genitiv"):   {"m": "en", "f": "er", "n": "en", "pl": "er"},
}

ART = {
    "schwach": {
        "nominativ": {"m": "der ", "f": "die ", "n": "das ", "pl": "die "},
        "akkusativ": {"m": "den ", "f": "die ", "n": "das ", "pl": "die "},
        "dativ":     {"m": "dem ", "f": "der ", "n": "dem ", "pl": "den "},
        "genitiv":   {"m": "des ", "f": "der ", "n": "des ", "pl": "der "},
    },
    "gemischt": {
        "nominativ": {"m": "ein ",   "f": "eine ",  "n": "ein ",   "pl": "meine "},
        "akkusativ": {"m": "einen ", "f": "eine ",  "n": "ein ",   "pl": "meine "},
        "dativ":     {"m": "einem ", "f": "einer ", "n": "einem ", "pl": "meinen "},
        "genitiv":   {"m": "eines ", "f": "einer ", "n": "eines ", "pl": "meiner "},
    },
}

CASE_DE = {"nominativ": "Nominativ", "akkusativ": "Akkusativ", "dativ": "Dativ", "genitiv": "Genitiv"}
GENDER_DE = {"m": "Maskulin", "f": "Feminin", "n": "Neutrum", "pl": "Plural"}
DER_WORD = {
    "nominativ": {"m": "der", "f": "die", "n": "das", "pl": "die"},
    "akkusativ": {"m": "den", "f": "die", "n": "das", "pl": "die"},
    "dativ":     {"m": "dem", "f": "der", "n": "dem", "pl": "den"},
    "genitiv":   {"m": "des", "f": "der", "n": "des", "pl": "der"},
}
REPAIR = {("nominativ", "m"): "der", ("nominativ", "n"): "das", ("akkusativ", "n"): "das"}

# ---------------------------------------------------------------- weak+mixed
# (adj_de, noun_word_for_lookup, gender, {case: (de_frame, en_frame)})
# de_frame: "{a}" = article slot, blank written as adjstem___
WM = [
    ("alt", "Mann", "m", {
        "nominativ": ("{a}alt___ Mann sitzt auf der Bank.", "{e}old man is sitting on the bench."),
        "akkusativ": ("Ich sehe {a}alt___ Mann vor dem Haus.", "I see {e}old man in front of the house."),
        "dativ": ("Wir helfen {a}alt___ Mann beim Einkaufen.", "We help {e}old man with the shopping."),
        "genitiv": ("Die Tasche {a}alt___ Mannes liegt auf der Bank.", "The bag of {e}old man is lying on the bench."),
    }),
    ("neu", "Tisch", "m", {
        "nominativ": ("{a}neu___ Tisch steht in der Küche.", "{e}new table stands in the kitchen."),
        "akkusativ": ("Wir kaufen {a}neu___ Tisch für das Wohnzimmer.", "We are buying {e}new table for the living room."),
        "dativ": ("Auf {a}neu___ Tisch liegen viele Bücher.", "Many books are lying on {e}new table."),
        "genitiv": ("Die Farbe {a}neu___ Tisches gefällt mir.", "I like the color of {e}new table."),
    }),
    ("klein", "Schlüssel", "m", {
        "nominativ": ("{a}klein___ Schlüssel liegt auf dem Tisch.", "{e}small key is lying on the table."),
        "akkusativ": ("Ich suche {a}klein___ Schlüssel für diese Tür.", "I am looking for {e}small key for this door."),
        "dativ": ("Mit {a}klein___ Schlüssel öffnet er die Tür.", "He opens the door with {e}small key."),
        "genitiv": ("Die Form {a}klein___ Schlüssels ist ungewöhnlich.", "The shape of {e}small key is unusual."),
    }),
    ("lang", "Brief", "m", {
        "nominativ": ("{a}lang___ Brief liegt auf dem Schreibtisch.", "{e}long letter is lying on the desk."),
        "akkusativ": ("Sie schreibt {a}lang___ Brief an ihre Mutter.", "She is writing {e}long letter to her mother."),
        "dativ": ("In {a}lang___ Brief erklärt er alles.", "He explains everything in {e}long letter."),
        "genitiv": ("Das Ende {a}lang___ Briefes überrascht mich.", "The ending of {e}long letter surprises me."),
    }),
    ("schön", "Garten", "m", {
        "nominativ": ("{a}schön___ Garten liegt hinter dem Haus.", "{e}beautiful garden lies behind the house."),
        "akkusativ": ("Wir besuchen {a}schön___ Garten am Sonntag.", "We are visiting {e}beautiful garden on Sunday."),
        "dativ": ("In {a}schön___ Garten spielen die Kinder.", "The children are playing in {e}beautiful garden."),
        "genitiv": ("Die Blumen {a}schön___ Gartens blühen im Mai.", "The flowers of {e}beautiful garden bloom in May."),
    }),
    ("groß", "Berg", "m", {
        "nominativ": ("{a}groß___ Berg ist von hier zu sehen.", "{e}big mountain can be seen from here."),
        "akkusativ": ("Wir sehen {a}groß___ Berg aus dem Fenster.", "We see {e}big mountain from the window."),
        "dativ": ("Auf {a}groß___ Berg liegt noch Schnee.", "There is still snow on {e}big mountain."),
        "genitiv": ("Der Gipfel {a}groß___ Berges ist weiß.", "The peak of {e}big mountain is white."),
    }),
    ("freundlich", "Arzt", "m", {
        "nominativ": ("{a}freundlich___ Arzt arbeitet im Krankenhaus.", "{e}friendly doctor works at the hospital."),
        "akkusativ": ("Ich kenne {a}freundlich___ Arzt in dieser Stadt.", "I know {e}friendly doctor in this city."),
        "dativ": ("Sie dankt {a}freundlich___ Arzt für die Hilfe.", "She thanks {e}friendly doctor for the help."),
        "genitiv": ("Die Praxis {a}freundlich___ Arztes ist immer voll.", "The practice of {e}friendly doctor is always full."),
    }),
    ("jung", "Lehrer", "m", {
        "nominativ": ("{a}jung___ Lehrer erklärt die Aufgabe.", "{e}young teacher explains the task."),
        "akkusativ": ("Die Schüler mögen {a}jung___ Lehrer.", "The students like {e}young teacher."),
        "dativ": ("Das Buch gehört {a}jung___ Lehrer.", "The book belongs to {e}young teacher."),
        "genitiv": ("Der Unterricht {a}jung___ Lehrers macht Spaß.", "The lessons of {e}young teacher are fun."),
    }),
    ("jung", "Frau", "f", {
        "nominativ": ("{a}jung___ Frau wartet an der Haltestelle.", "{e}young woman is waiting at the bus stop."),
        "akkusativ": ("Er fragt {a}jung___ Frau nach dem Weg.", "He asks {e}young woman for directions."),
        "dativ": ("Der Mantel gefällt {a}jung___ Frau.", "{e}young woman likes the coat."),
        "genitiv": ("Die Tasche {a}jung___ Frau ist blau.", "The bag of {e}young woman is blue."),
    }),
    ("groß", "Stadt", "f", {
        "nominativ": ("{a}groß___ Stadt hat viele Museen.", "{e}big city has many museums."),
        "akkusativ": ("Wir besuchen {a}groß___ Stadt im Sommer.", "We are visiting {e}big city in the summer."),
        "dativ": ("In {a}groß___ Stadt gibt es viel zu sehen.", "There is a lot to see in {e}big city."),
        "genitiv": ("Die Straßen {a}groß___ Stadt sind voll.", "The streets of {e}big city are full."),
    }),
    ("offen", "Tür", "f", {
        "nominativ": ("{a}offen___ Tür führt in den Garten.", "{e}open door leads into the garden."),
        "akkusativ": ("Bitte schließ {a}offen___ Tür!", "Please close {e}open door!"),
        "dativ": ("Er steht vor {a}offen___ Tür.", "He is standing in front of {e}open door."),
        "genitiv": ("Wegen {a}offen___ Tür ist es kalt im Zimmer.", "Because of {e}open door, the room is cold."),
    }),
    ("breit", "Straße", "f", {
        "nominativ": ("{a}breit___ Straße führt zum Bahnhof.", "{e}wide street leads to the station."),
        "akkusativ": ("Wir überqueren {a}breit___ Straße.", "We cross {e}wide street."),
        "dativ": ("Auf {a}breit___ Straße fahren viele Autos.", "Many cars drive on {e}wide street."),
        "genitiv": ("Am Ende {a}breit___ Straße steht eine Kirche.", "At the end of {e}wide street stands a church."),
    }),
    ("einfach", "Frage", "f", {
        "nominativ": ("{a}einfach___ Frage hat manchmal keine klare Antwort.", "{e}simple question sometimes has no clear answer."),
        "akkusativ": ("Der Lehrer stellt {a}einfach___ Frage.", "The teacher asks {e}simple question."),
        "dativ": ("Wir beginnen mit {a}einfach___ Frage.", "We start with {e}simple question."),
        "genitiv": ("Die Bedeutung {a}einfach___ Frage wird oft unterschätzt.", "The importance of {e}simple question is often underestimated."),
    }),
    ("klein", "Küche", "f", {
        "nominativ": ("{a}klein___ Küche ist trotzdem praktisch.", "{e}small kitchen is practical nonetheless."),
        "akkusativ": ("Sie putzt {a}klein___ Küche jeden Samstag.", "She cleans {e}small kitchen every Saturday."),
        "dativ": ("In {a}klein___ Küche riecht es nach Kaffee.", "It smells of coffee in {e}small kitchen."),
        "genitiv": ("Das Fenster {a}klein___ Küche ist offen.", "The window of {e}small kitchen is open."),
    }),
    ("schwer", "Tasche", "f", {
        "nominativ": ("{a}schwer___ Tasche steht neben der Tür.", "{e}heavy bag is standing next to the door."),
        "akkusativ": ("Er trägt {a}schwer___ Tasche die Treppe hinauf.", "He carries {e}heavy bag up the stairs."),
        "dativ": ("Sie kommt mit {a}schwer___ Tasche nach Hause.", "She comes home with {e}heavy bag."),
        "genitiv": ("Der Griff {a}schwer___ Tasche ist kaputt.", "The handle of {e}heavy bag is broken."),
    }),
    ("gut", "Idee", "f", {
        "nominativ": ("{a}gut___ Idee kommt oft beim Spazierengehen.", "{e}good idea often comes while taking a walk."),
        "akkusativ": ("Wir diskutieren {a}gut___ Idee im Team.", "We discuss {e}good idea in the team."),
        "dativ": ("Von {a}gut___ Idee zur Umsetzung ist es ein weiter Weg.", "It is a long way from {e}good idea to implementation."),
        "genitiv": ("Der Erfolg {a}gut___ Idee hängt von der Umsetzung ab.", "The success of {e}good idea depends on the implementation."),
    }),
    ("klein", "Kind", "n", {
        "nominativ": ("{a}klein___ Kind spielt im Garten.", "{e}small child is playing in the garden."),
        "akkusativ": ("Die Mutter ruft {a}klein___ Kind.", "The mother calls {e}small child."),
        "dativ": ("Sie gibt {a}klein___ Kind einen Apfel.", "She gives {e}small child an apple."),
        "genitiv": ("Das Spielzeug {a}klein___ Kindes liegt überall.", "The toys of {e}small child are lying everywhere."),
    }),
    ("groß", "Haus", "n", {
        "nominativ": ("{a}groß___ Haus steht am Ende der Straße.", "{e}big house stands at the end of the street."),
        "akkusativ": ("Die Familie kauft {a}groß___ Haus auf dem Land.", "The family is buying {e}big house in the countryside."),
        "dativ": ("In {a}groß___ Haus wohnen drei Familien.", "Three families live in {e}big house."),
        "genitiv": ("Das Dach {a}groß___ Hauses ist rot.", "The roof of {e}big house is red."),
    }),
    ("neu", "Auto", "n", {
        "nominativ": ("{a}neu___ Auto steht in der Garage.", "{e}new car is in the garage."),
        "akkusativ": ("Er fährt {a}neu___ Auto sehr vorsichtig.", "He drives {e}new car very carefully."),
        "dativ": ("Mit {a}neu___ Auto fahren wir nach Italien.", "We are driving to Italy in {e}new car."),
        "genitiv": ("Der Motor {a}neu___ Autos ist sehr leise.", "The engine of {e}new car is very quiet."),
    }),
    ("interessant", "Buch", "n", {
        "nominativ": ("{a}interessant___ Buch liegt auf dem Nachttisch.", "{e}interesting book is lying on the nightstand."),
        "akkusativ": ("Sie liest {a}interessant___ Buch über Berlin.", "She is reading {e}interesting book about Berlin."),
        "dativ": ("In {a}interessant___ Buch findet man viele Antworten.", "One finds many answers in {e}interesting book."),
        "genitiv": ("Der Autor {a}interessant___ Buches kommt aus Wien.", "The author of {e}interesting book is from Vienna."),
    }),
    ("hell", "Zimmer", "n", {
        "nominativ": ("{a}hell___ Zimmer liegt im dritten Stock.", "{e}bright room is on the third floor."),
        "akkusativ": ("Wir suchen {a}hell___ Zimmer mit Balkon.", "We are looking for {e}bright room with a balcony."),
        "dativ": ("In {a}hell___ Zimmer arbeitet es sich besser.", "It is easier to work in {e}bright room."),
        "genitiv": ("Die Miete {a}hell___ Zimmers ist hoch.", "The rent of {e}bright room is high."),
    }),
    ("offen", "Fenster", "n", {
        "nominativ": ("{a}offen___ Fenster lässt frische Luft herein.", "{e}open window lets fresh air in."),
        "akkusativ": ("Er schließt {a}offen___ Fenster vor dem Schlafen.", "He closes {e}open window before sleeping."),
        "dativ": ("Sie sitzt an {a}offen___ Fenster.", "She is sitting at {e}open window."),
        "genitiv": ("Wegen {a}offen___ Fensters ist es kalt.", "It is cold because of {e}open window."),
    }),
    ("neu", "Handy", "n", {
        "nominativ": ("{a}neu___ Handy liegt noch im Karton.", "{e}new phone is still in the box."),
        "akkusativ": ("Er kauft {a}neu___ Handy im Internet.", "He is buying {e}new phone online."),
        "dativ": ("Mit {a}neu___ Handy macht sie bessere Fotos.", "She takes better photos with {e}new phone."),
        "genitiv": ("Der Akku {a}neu___ Handys hält zwei Tage.", "The battery of {e}new phone lasts two days."),
    }),
    ("schwierig", "Problem", "n", {
        "nominativ": ("{a}schwierig___ Problem braucht eine gute Lösung.", "{e}difficult problem needs a good solution."),
        "akkusativ": ("Das Team löst {a}schwierig___ Problem gemeinsam.", "The team solves {e}difficult problem together."),
        "dativ": ("An {a}schwierig___ Problem arbeiten wir seit Wochen.", "We have been working on {e}difficult problem for weeks."),
        "genitiv": ("Die Lösung {a}schwierig___ Problems dauert Zeit.", "Solving {e}difficult problem takes time."),
    }),
    ("alt", "Haus", "pl", {
        "nominativ": ("{a}alt___ Häuser stehen in der Altstadt.", "{e}old houses stand in the old town."),
        "akkusativ": ("Die Stadt renoviert {a}alt___ Häuser.", "The city is renovating {e}old houses."),
        "dativ": ("In {a}alt___ Häusern wohnen viele Studenten.", "Many students live in {e}old houses."),
        "genitiv": ("Die Fassaden {a}alt___ Häuser sind bunt.", "The facades of {e}old houses are colorful."),
    }),
    ("gut", "Freund", "pl", {
        "nominativ": ("{a}gut___ Freunde helfen in jeder Situation.", "{e}good friends help in every situation."),
        "akkusativ": ("Ich treffe {a}gut___ Freunde am Wochenende.", "I am meeting {e}good friends at the weekend."),
        "dativ": ("Mit {a}gut___ Freunden ist das Leben leichter.", "Life is easier with {e}good friends."),
        "genitiv": ("Der Rat {a}gut___ Freunde ist viel wert.", "The advice of {e}good friends is worth a lot."),
    }),
    ("klein", "Kind", "pl", {
        "nominativ": ("{a}klein___ Kinder spielen auf dem Spielplatz.", "{e}small children are playing on the playground."),
        "akkusativ": ("Die Großeltern besuchen {a}klein___ Kinder.", "The grandparents are visiting {e}small children."),
        "dativ": ("Sie liest {a}klein___ Kindern eine Geschichte vor.", "She reads a story to {e}small children."),
        "genitiv": ("Das Lachen {a}klein___ Kinder füllt das Haus.", "The laughter of {e}small children fills the house."),
    }),
    ("interessant", "Buch", "pl", {
        "nominativ": ("{a}interessant___ Bücher stehen im Regal.", "{e}interesting books are on the shelf."),
        "akkusativ": ("Er verleiht {a}interessant___ Bücher nur ungern.", "He is reluctant to lend {e}interesting books."),
        "dativ": ("Von {a}interessant___ Büchern kann sie stundenlang erzählen.", "She can talk about {e}interesting books for hours."),
        "genitiv": ("Die Titel {a}interessant___ Bücher notiere ich mir.", "I write down the titles of {e}interesting books."),
    }),
    ("wichtig", "Frage", "pl", {
        "nominativ": ("{a}wichtig___ Fragen kommen am Ende.", "{e}important questions come at the end."),
        "akkusativ": ("Wir besprechen {a}wichtig___ Fragen morgen.", "We will discuss {e}important questions tomorrow."),
        "dativ": ("Bei {a}wichtig___ Fragen hilft der Chef.", "The boss helps with {e}important questions."),
        "genitiv": ("Die Klärung {a}wichtig___ Fragen dauert oft lange.", "Clarifying {e}important questions often takes a long time."),
    }),
    ("neu", "Idee", "pl", {
        "nominativ": ("{a}neu___ Ideen entstehen oft im Gespräch.", "{e}new ideas often emerge in conversation."),
        "akkusativ": ("Das Team sammelt {a}neu___ Ideen für die Zukunft.", "The team collects {e}new ideas for the future."),
        "dativ": ("Mit {a}neu___ Ideen überrascht sie alle.", "She surprises everyone with {e}new ideas."),
        "genitiv": ("Die Umsetzung {a}neu___ Ideen braucht Mut.", "Implementing {e}new ideas takes courage."),
    }),
]

# ---------------------------------------------------------------- strong
# Literal sentences: no article before the adjective (that is the point).
ST = [
    ("stark", "Kaffee", "m", {
        "nominativ": ("Stark___ Kaffee hilft am frühen Morgen.", "Strong coffee helps in the early morning."),
        "akkusativ": ("Ich trinke stark___ Kaffee ohne Zucker.", "I drink strong coffee without sugar."),
        "dativ": ("Mit stark___ Kaffee beginnt sein Tag.", "His day begins with strong coffee."),
        "genitiv": ("Der Geruch stark___ Kaffees füllt die Küche.", "The smell of strong coffee fills the kitchen."),
    }),
    ("stark", "Regen", "m", {
        "nominativ": ("Stark___ Regen fällt seit dem Morgen.", "Heavy rain has been falling since the morning."),
        "akkusativ": ("Der Wetterbericht meldet stark___ Regen für morgen.", "The weather report announces heavy rain for tomorrow."),
        "dativ": ("Bei stark___ Regen bleiben wir zu Hause.", "In heavy rain, we stay at home."),
        "genitiv": ("Wegen stark___ Regens fällt das Spiel aus.", "The game is cancelled because of heavy rain."),
    }),
    ("groß", "Einfluss", "m", {
        "nominativ": ("Groß___ Einfluss bedeutet auch Verantwortung.", "Great influence also means responsibility."),
        "akkusativ": ("Die Medien haben groß___ Einfluss auf die Meinung.", "The media have great influence on opinion."),
        "dativ": ("Mit groß___ Einfluss muss man vorsichtig umgehen.", "One must handle great influence carefully."),
        "genitiv": ("Trotz groß___ Einflusses blieb er bescheiden.", "Despite great influence, he remained modest."),
    }),
    ("groß", "Aufwand", "m", {
        "nominativ": ("Groß___ Aufwand lohnt sich nicht immer.", "Great effort is not always worth it."),
        "akkusativ": ("Das Projekt bedeutet groß___ Aufwand für alle.", "The project means great effort for everyone."),
        "dativ": ("Mit groß___ Aufwand wurde das Haus renoviert.", "The house was renovated with great effort."),
        "genitiv": ("Wegen groß___ Aufwands verschieben wir den Plan.", "Because of great effort involved, we are postponing the plan."),
    }),
    ("schwer", "Verlust", "m", {
        "nominativ": ("Schwer___ Verlust schmerzt noch lange.", "Heavy loss hurts for a long time."),
        "akkusativ": ("Die Firma meldet schwer___ Verlust.", "The company reports heavy loss."),
        "dativ": ("Nach schwer___ Verlust braucht man Freunde.", "After heavy loss, one needs friends."),
        "genitiv": ("Trotz schwer___ Verlustes machte sie weiter.", "Despite heavy loss, she carried on."),
    }),
    ("erheblich", "Rückgang", "m", {
        "nominativ": ("Erheblich___ Rückgang zeigt sich in den Zahlen.", "Considerable decline shows in the figures."),
        "akkusativ": ("Die Studie zeigt erheblich___ Rückgang bei den Verkäufen.", "The study shows considerable decline in sales."),
        "dativ": ("Von erheblich___ Rückgang sprechen die Experten.", "The experts speak of considerable decline."),
        "genitiv": ("Wegen erheblich___ Rückgangs schließt das Geschäft.", "The shop is closing because of considerable decline."),
    }),
    ("kalt", "Milch", "f", {
        "nominativ": ("Kalt___ Milch schmeckt am besten zum Frühstück.", "Cold milk tastes best at breakfast."),
        "akkusativ": ("Das Kind trinkt kalt___ Milch.", "The child drinks cold milk."),
        "dativ": ("Müsli mit kalt___ Milch ist sein Frühstück.", "Muesli with cold milk is his breakfast."),
        "genitiv": ("Der Geschmack kalt___ Milch erinnert ihn an früher.", "The taste of cold milk reminds him of the old days."),
    }),
    ("gut", "Gesundheit", "f", {
        "nominativ": ("Gut___ Gesundheit ist das größte Geschenk.", "Good health is the greatest gift."),
        "akkusativ": ("Ich wünsche dir gut___ Gesundheit im neuen Jahr.", "I wish you good health in the new year."),
        "dativ": ("Bei gut___ Gesundheit arbeitet er gern weiter.", "In good health, he is happy to keep working."),
        "genitiv": ("Trotz gut___ Gesundheit macht sie sich Sorgen.", "Despite good health, she worries."),
    }),
    ("neu", "Energie", "f", {
        "nominativ": ("Neu___ Energie kommt nach einer Pause.", "New energy comes after a break."),
        "akkusativ": ("Der Urlaub gibt mir neu___ Energie.", "The holiday gives me new energy."),
        "dativ": ("Mit neu___ Energie startet sie in die Woche.", "She starts the week with new energy."),
        "genitiv": ("Sport ist eine Quelle neu___ Energie.", "Sport is a source of new energy."),
    }),
    ("groß", "Freiheit", "f", {
        "nominativ": ("Groß___ Freiheit bedeutet große Verantwortung.", "Great freedom means great responsibility."),
        "akkusativ": ("Die Studenten genießen groß___ Freiheit.", "The students enjoy great freedom."),
        "dativ": ("Mit groß___ Freiheit muss man umgehen können.", "One must know how to handle great freedom."),
        "genitiv": ("Das Gefühl groß___ Freiheit macht glücklich.", "The feeling of great freedom makes one happy."),
    }),
    ("schwer", "Arbeit", "f", {
        "nominativ": ("Schwer___ Arbeit macht müde.", "Hard work makes you tired."),
        "akkusativ": ("Der Umzug bedeutet schwer___ Arbeit.", "The move means hard work."),
        "dativ": ("Nach schwer___ Arbeit schmeckt das Essen besser.", "After hard work, food tastes better."),
        "genitiv": ("Der Lohn schwer___ Arbeit ist der Feierabend.", "The reward of hard work is the end of the workday."),
    }),
    ("groß", "Verantwortung", "f", {
        "nominativ": ("Groß___ Verantwortung liegt auf ihren Schultern.", "Great responsibility rests on her shoulders."),
        "akkusativ": ("Der Chef trägt groß___ Verantwortung.", "The boss carries great responsibility."),
        "dativ": ("Mit groß___ Verantwortung kommt auch Druck.", "With great responsibility comes pressure."),
        "genitiv": ("Wegen groß___ Verantwortung schläft er schlecht.", "He sleeps badly because of great responsibility."),
    }),
    ("stark", "Leistung", "f", {
        "nominativ": ("Stark___ Leistung verdient Anerkennung.", "Strong performance deserves recognition."),
        "akkusativ": ("Das Team zeigt stark___ Leistung im Finale.", "The team shows strong performance in the final."),
        "dativ": ("Nach stark___ Leistung folgt die Belohnung.", "After strong performance comes the reward."),
        "genitiv": ("Trotz stark___ Leistung verlor die Mannschaft.", "Despite strong performance, the team lost."),
    }),
    ("groß", "Anerkennung", "f", {
        "nominativ": ("Groß___ Anerkennung motiviert das ganze Team.", "Great recognition motivates the whole team."),
        "akkusativ": ("Ihre Arbeit verdient groß___ Anerkennung.", "Her work deserves great recognition."),
        "dativ": ("Mit groß___ Anerkennung kam auch mehr Geld.", "With great recognition came more money."),
        "genitiv": ("Ein Zeichen groß___ Anerkennung ist dieses Geschenk.", "This gift is a sign of great recognition."),
    }),
    ("kalt", "Wasser", "n", {
        "nominativ": ("Kalt___ Wasser erfrischt an heißen Tagen.", "Cold water is refreshing on hot days."),
        "akkusativ": ("Er trinkt kalt___ Wasser nach dem Sport.", "He drinks cold water after sports."),
        "dativ": ("Mit kalt___ Wasser wäscht sie ihr Gesicht.", "She washes her face with cold water."),
        "genitiv": ("Die Wirkung kalt___ Wassers ist erfrischend.", "The effect of cold water is refreshing."),
    }),
    ("warm", "Brot", "n", {
        "nominativ": ("Warm___ Brot duftet durch das ganze Haus.", "Warm bread smells through the whole house."),
        "akkusativ": ("Die Bäckerei verkauft warm___ Brot ab sechs Uhr.", "The bakery sells warm bread from six o'clock."),
        "dativ": ("Zu warm___ Brot passt Butter am besten.", "Butter goes best with warm bread."),
        "genitiv": ("Der Duft warm___ Brotes weckt die Familie.", "The smell of warm bread wakes the family."),
    }),
    ("lecker", "Essen", "n", {
        "nominativ": ("Lecker___ Essen macht alle glücklich.", "Delicious food makes everyone happy."),
        "akkusativ": ("Die Großmutter kocht lecker___ Essen für alle.", "The grandmother cooks delicious food for everyone."),
        "dativ": ("Bei lecker___ Essen vergisst man die Zeit.", "Over delicious food, one forgets the time."),
        "genitiv": ("Der Geruch lecker___ Essens zieht durchs Haus.", "The smell of delicious food drifts through the house."),
    }),
    ("groß", "Interesse", "n", {
        "nominativ": ("Groß___ Interesse besteht an diesem Kurs.", "There is great interest in this course."),
        "akkusativ": ("Die Schüler zeigen groß___ Interesse am Thema.", "The students show great interest in the topic."),
        "dativ": ("Mit groß___ Interesse liest sie die Nachrichten.", "She reads the news with great interest."),
        "genitiv": ("Ein Zeichen groß___ Interesses sind viele Fragen.", "Many questions are a sign of great interest."),
    }),
    ("gut", "Geld", "n", {
        "nominativ": ("Gut___ Geld verdient man nicht im Schlaf.", "Good money is not earned in one's sleep."),
        "akkusativ": ("Sie verdient gut___ Geld in ihrem neuen Job.", "She earns good money in her new job."),
        "dativ": ("Von gut___ Geld allein wird man nicht glücklich.", "Good money alone does not make one happy."),
        "genitiv": ("Der Wert gut___ Geldes zeigt sich in der Krise.", "The value of good money shows in a crisis."),
    }),
    ("gut", "Verhalten", "n", {
        "nominativ": ("Gut___ Verhalten wird oft belohnt.", "Good behavior is often rewarded."),
        "akkusativ": ("Der Lehrer lobt gut___ Verhalten.", "The teacher praises good behavior."),
        "dativ": ("Bei gut___ Verhalten gibt es eine Belohnung.", "For good behavior, there is a reward."),
        "genitiv": ("Die Folge gut___ Verhaltens ist Vertrauen.", "The result of good behavior is trust."),
    }),
    ("alt", "Haus", "pl", {
        "nominativ": ("Alt___ Häuser haben ihren eigenen Charme.", "Old houses have their own charm."),
        "akkusativ": ("Die Stadt renoviert alt___ Häuser im Zentrum.", "The city renovates old houses in the center."),
        "dativ": ("In alt___ Häusern ist es oft kühl.", "It is often cool in old houses."),
        "genitiv": ("Die Renovierung alt___ Häuser kostet viel.", "The renovation of old houses costs a lot."),
    }),
    ("neu", "Idee", "pl", {
        "nominativ": ("Neu___ Ideen verändern die Welt.", "New ideas change the world."),
        "akkusativ": ("Wir brauchen neu___ Ideen für dieses Problem.", "We need new ideas for this problem."),
        "dativ": ("Mit neu___ Ideen gewinnt man Kunden.", "One wins customers with new ideas."),
        "genitiv": ("Die Kraft neu___ Ideen ist enorm.", "The power of new ideas is enormous."),
    }),
    ("gut", "Freund", "pl", {
        "nominativ": ("Gut___ Freunde sind wie ein zweites Zuhause.", "Good friends are like a second home."),
        "akkusativ": ("Man findet gut___ Freunde nicht jeden Tag.", "One does not find good friends every day."),
        "dativ": ("Mit gut___ Freunden feiert es sich am besten.", "Celebrating is best with good friends."),
        "genitiv": ("Die Hilfe gut___ Freunde ist unbezahlbar.", "The help of good friends is priceless."),
    }),
    ("interessant", "Buch", "pl", {
        "nominativ": ("Interessant___ Bücher findet man in dieser Bibliothek.", "One finds interesting books in this library."),
        "akkusativ": ("Sie liest interessant___ Bücher am liebsten abends.", "She prefers reading interesting books in the evening."),
        "dativ": ("Von interessant___ Büchern erzählt er gern.", "He likes talking about interesting books."),
        "genitiv": ("Die Auswahl interessant___ Bücher ist hier groß.", "The selection of interesting books here is large."),
    }),
    ("klein", "Kind", "pl", {
        "nominativ": ("Klein___ Kinder brauchen viel Schlaf.", "Small children need a lot of sleep."),
        "akkusativ": ("Der Zirkus begeistert klein___ Kinder besonders.", "The circus especially delights small children."),
        "dativ": ("Mit klein___ Kindern reist man langsamer.", "One travels more slowly with small children."),
        "genitiv": ("Das Lachen klein___ Kinder ist ansteckend.", "The laughter of small children is contagious."),
    }),
    ("wichtig", "Frage", "pl", {
        "nominativ": ("Wichtig___ Fragen verdienen gute Antworten.", "Important questions deserve good answers."),
        "akkusativ": ("Der Journalist stellt wichtig___ Fragen.", "The journalist asks important questions."),
        "dativ": ("Bei wichtig___ Fragen nimmt er sich Zeit.", "He takes his time with important questions."),
        "genitiv": ("Die Klärung wichtig___ Fragen steht noch aus.", "The clarification of important questions is still pending."),
    }),
    ("jung", "Lehrer", "pl", {
        "nominativ": ("Jung___ Lehrer bringen frische Ideen mit.", "Young teachers bring fresh ideas."),
        "akkusativ": ("Die Schule sucht jung___ Lehrer für Mathematik.", "The school is looking for young teachers for mathematics."),
        "dativ": ("Von jung___ Lehrern lernen auch die Kollegen.", "Colleagues also learn from young teachers."),
        "genitiv": ("Die Begeisterung jung___ Lehrer motiviert die Klasse.", "The enthusiasm of young teachers motivates the class."),
    }),
    ("schwierig", "Aufgabe", "pl", {
        "nominativ": ("Schwierig___ Aufgaben machen ihr sogar Spaß.", "She even enjoys difficult tasks."),
        "akkusativ": ("Der Test enthält schwierig___ Aufgaben.", "The test contains difficult tasks."),
        "dativ": ("An schwierig___ Aufgaben wächst man.", "One grows through difficult tasks."),
        "genitiv": ("Die Lösung schwierig___ Aufgaben braucht Geduld.", "Solving difficult tasks takes patience."),
    }),
    ("schön", "Stadt", "pl", {
        "nominativ": ("Schön___ Städte ziehen viele Touristen an.", "Beautiful cities attract many tourists."),
        "akkusativ": ("Wir besuchen schön___ Städte in ganz Europa.", "We visit beautiful cities all over Europe."),
        "dativ": ("In schön___ Städten bleibt man gern länger.", "One likes to stay longer in beautiful cities."),
        "genitiv": ("Die Plätze schön___ Städte sind oft voll.", "The squares of beautiful cities are often full."),
    }),
    ("neu", "Auto", "pl", {
        "nominativ": ("Neu___ Autos verbrauchen weniger Benzin.", "New cars use less petrol."),
        "akkusativ": ("Die Firma kauft neu___ Autos für das Team.", "The company is buying new cars for the team."),
        "dativ": ("Mit neu___ Autos fährt man sicherer.", "One drives more safely in new cars."),
        "genitiv": ("Die Preise neu___ Autos steigen weiter.", "The prices of new cars keep rising."),
    }),
]

CASES = ["nominativ", "akkusativ", "dativ", "genitiv"]


def load_pools():
    adjs = json.load(open(os.path.join(ROOT, "data/adjectives.json")))
    if isinstance(adjs, dict):
        adjs = adjs.get("adjectives", adjs.get("items"))
    nouns = json.load(open(os.path.join(ROOT, "data/nouns.json")))
    if isinstance(nouns, dict):
        nouns = nouns.get("nouns", nouns.get("items"))
    return {a["word"]: a for a in adjs}, {n["word"]: n for n in nouns}


def feedback(pattern, case, gender, ending):
    cs, gd = CASE_DE[case], GENDER_DE[gender]
    if pattern == "schwach":
        if ending == "e":
            why = "in the -e zone (Nominativ singular + Akkusativ feminine/neuter), the der-word carries the full signal."
        else:
            why = "outside the -e zone, every weak form takes -en."
        return f"Schwache Deklination nach der-Wort: {cs} {gd} → -{ending} — {why}"
    if pattern == "gemischt":
        if (case, gender) in REPAIR:
            echo = REPAIR[(case, gender)]
            return (f"Gemischte Deklination: 'ein' hides the gender in {cs} {gd}, "
                    f"so the adjective repairs it with -{ending} (echoing '{echo}').")
        return (f"Gemischte Deklination: {cs} {gd} is outside the three repair spots, "
                f"so the ending matches the weak pattern → -{ending}.")
    # stark
    if case == "genitiv" and gender in ("m", "n"):
        return (f"Starke Deklination, Genitiv exception: the noun's own -s already signals the case, "
                f"so the adjective takes -en instead of -es.")
    echo = DER_WORD[case][gender]
    return (f"Starke Deklination: no article, so the adjective carries the signal itself — "
            f"{cs} {gd} → -{ending} (echoing '{echo}').")


def en_article(pattern, gender, en_frame):
    if pattern == "schwach":
        return "the "
    if gender == "pl":
        return "my "
    after = en_frame.split("{e}", 1)[1] if "{e}" in en_frame else ""
    return "an " if after[:1].lower() in "aeiou" else "a "


def build():
    adj_by_word, noun_by_word = load_pools()
    out = []
    for pattern, pairs in (("schwach", WM), ("gemischt", WM), ("stark", ST)):
        for case in CASES:
            seq = 0
            for adj, noun_word, gender, frames in pairs:
                seq += 1
                de_frame, en_frame = frames[case]
                if pattern == "stark":
                    de, en = de_frame, en_frame
                else:
                    art = ART[pattern][case][gender]
                    de = de_frame.replace("{a}", art)
                    en = en_frame.replace("{e}", en_article(pattern, gender, en_frame))
                de = de[0].upper() + de[1:]
                en = en[0].upper() + en[1:]
                a, n = adj_by_word[adj], noun_by_word[noun_word]
                ending = TABLE[(pattern, case)][gender]
                out.append({
                    "id": f"dekl_{pattern}_{case[:3]}_{seq:03d}",
                    "type": "type_ending",
                    "cefr": a["cefr"],
                    "adjective_id": a["id"],
                    "noun_id": n["id"],
                    "pattern": pattern,
                    "case": case,
                    "gender": gender,
                    "sentence_de": de,
                    "sentence_en": en,
                    "correct": ending,
                    "feedback": feedback(pattern, case, gender, ending),
                })
    return out


if __name__ == "__main__":
    exercises = build()
    path = os.path.join(ROOT, "data/exercises/exercises-declension.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(exercises, f, ensure_ascii=False, indent=2)
    from collections import Counter
    c = Counter((e["pattern"], e["case"]) for e in exercises)
    print(f"Wrote {len(exercises)} exercises -> {path}")
    for k in sorted(c):
        print(" ", k, c[k])
