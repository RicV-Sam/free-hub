const SLANG_SLUG = "south-african-slang";
const tourism = "https://www.southafrica.net/gl/en/trade/welcome/tip/five-south-african-words-and-phrases-to-teach-your-guests";
const dictionary = (entry) => `https://dsae.co.za/entry/${entry}`;
// These exact DSAE entries were checked for a pronunciation player.
const dictionaryAudioEntries = [
  "aikona/e00153", "bakgat/e00514", "bakkie/e00518", "chommie/e01639",
  "eish/e10058", "ekasi/e10062", "galla/e02535", "gashle/e02565",
  "jol/e03505", "kasi/e10115",
  "kwaai/e04165", "larney/e04243", "lekker/e04283", "majita/e04471",
  "makoya/e10121", "robot/e06032", "shibobo/e10123",
  "shu/e06441", "yebo/e07960",
];
const dictionaryAudioByTerm = new Map(Object.entries({
  Babbelas: "babalaas/e00453", Boet: "boet/e01017", Braai: "braai/e01198",
  Eina: "eina/e02232", Gatvol: "gatvol/e10111", Gooi: "gooi/e02747", Padkos: "padkos/e05484",
}));
const dictionaryAudioUrls = new Set(dictionaryAudioEntries.map(dictionary));
const bakkieRecording = {
  path: "/assets/slang/bakkie-en-za.mp3",
  source: "https://commons.wikimedia.org/wiki/File:En-za-bakkie.ogg",
  creator: "Theonlycatonice",
  license: "https://creativecommons.org/licenses/by-sa/4.0/",
};
const cape = "Cape Town & Cape Flats";
const kzn = "Durban & KwaZulu-Natal";
const easternCape = "Gqeberha & Mthatha";
const soweto = "Soweto";
const pretoria = "Pretoria & Tshwane";
const limpopo = "Limpopo";
const tshwane = "https://www.tutfadshowcase.ac.za/_files/ugd/536713_c524e35a9c9a4cf59ac965e1eb4484ab.pdf";
const sepitori = "https://arushalinguistics.org/publications/Ditsele_AWPAL_2019.pdf";
const campus = "https://backoffice.biblio.ugent.be/download/811167/6824054";
const vuwani = "https://www.researchgate.net/publication/388707718_EXPLORING_ADDRESS_TERMS_IN_TSHIVENDA_USED_BY_THE_YOUTH_A_STUDY_FROM_VUWANI_LIMPOPO_PROVINCE";
const tshironga = "https://aeaa.journals.ac.za/sajhe/article/view/5424/3875";
const vendaLesson = "https://mzansilingua.org/languages/tshivenda";
const pediLesson = "https://mzansilingua.org/trial/sepedi";
const sepitoriNarratives = "https://wiredspace.wits.ac.za/bitstreams/062d03b6-6a7e-46de-a256-b8bda29fab2c/download";
const itsoseng = "https://www.arushalinguistics.org/publications/Tshotetsi_et_al_AWPAL_2021.pdf";
const kaaps = "https://capecolouredculture.co.za/culture/talk-kaaps-with-me/";
const durban = "https://www.ecr.co.za/lifestyle/family/durban-lingo-common-phrases-only-durbanites-understand/";
const indianEnglish = "https://lexikos.journals.ac.za/pub/article/download/444/153";
const xhosa = "https://journals.bilpubgroup.com/index.php/fls/article/view/10273";
const iscamtho = "https://wiredspace.wits.ac.za/server/api/core/bitstreams/006d3bd8-0749-452b-a542-f460879fcdeb/content";
const languageCentre = "https://languagecentre.up.ac.za/post/saying-hi-to-south-africans-you-meet";
const graze = "https://specialprojects.news24.com/the-south-african-food-dictionary/index.html";

const entries = [
  { term: "Awe ma se kind", aliases: "Aweh ma se kind · Awe my ma se kind", group: "Greetings & mates", region: cape, meaning: "A warm, familiar hello, roughly “Hey, my dear friend”. The longer form literally greets “my mother’s child”.", example: "Awe ma se kind! It’s been ages.", source: "https://scielo.org.za/pdf/jsr/v30n2/10.pdf" },
  { term: "Awe", aliases: "Aweh · Awê", group: "Greetings & mates", region: cape, say: "AH-weh", meaning: "A casual hello. In conversation it can also signal agreement, like saying “cool”.", example: "Awe! You made it.", source: "https://capecolouredculture.co.za/dictionary/aweh-meaning/" },
  { term: "Sharp", aliases: "Sharp-sharp", group: "Greetings & mates", meaning: "A quick hello, an enthusiastic thumbs-up or a way to say “all good”.", example: "“See you at six?” “Sharp-sharp.”", source: tourism },
  { term: "Howzit", aliases: "How’s it · Hoesit", group: "Greetings & mates", say: "HOW-zit", meaning: "An informal hello that can double as “How are you?”", example: "Howzit! How was your weekend?", source: tourism },
  { term: "Boet", group: "Greetings & mates", say: "boot", meaning: "Afrikaans for “brother”, also used as a friendly way to address a man.", example: "Thanks for the lift, boet.", source: tourism },
  { term: "Chommie", aliases: "Tjommie", group: "Greetings & mates", say: "CHOM-ee", meaning: "A friend or mate. You can also use it when speaking directly to a friend.", example: "My chommie saved me a seat.", source: dictionary("chommie/e01639") },
  { term: "Heita", group: "Greetings & mates", say: "AY-ta", meaning: "A casual greeting.", example: "Heita! Come sit with us.", source: tourism },
  { term: "Eish", aliases: "Aish · Heish", group: "Reactions", say: "AYSH", meaning: "An exclamation from Tsotsitaal. It can carry surprise, frustration or resignation, depending on the moment.", example: "Eish, I left my keys inside again.", source: dictionary("eish/e10058") },
  { term: "Ag, shame", group: "Reactions", meaning: "A sympathetic or affectionate reaction. You might say it about a friend having a rough day or a tiny dog in an oversized jersey.", example: "Ag, shame, did you miss your bus?", source: tourism },
  { term: "Aikona", aliases: "Haikona", group: "Reactions", meaning: "An emphatic “No way!” or “Absolutely not!”", example: "Aikona, I’m not getting up at four on a Sunday.", source: dictionary("aikona/e00153") },
  { term: "Yebo", group: "Reactions", say: "YEH-baw", meaning: "The isiZulu word for “yes”, also used in conversation to show agreement.", example: "“Are we still on for Saturday?” “Yebo!”", source: dictionary("yebo/e07960") },
  { term: "Lekker", aliases: "Lekka", group: "Reactions", say: "LEH-kuh", meaning: "Delicious when you’re talking about food. It can also mean great or enjoyable.", example: "That was a lekker weekend.", source: dictionary("lekker/e04283") },
  { term: "Bakgat", group: "Reactions", meaning: "An enthusiastic way to say something is excellent.", example: "You got us front-row seats? Bakgat!", source: dictionary("bakgat/e00514") },
  { term: "Kwaai", group: "Reactions", meaning: "Can mean excellent as slang. In other contexts it can mean fierce or bad-tempered, so listen for the tone.", example: "That drum solo was kwaai!", source: dictionary("kwaai/e04165") },
  { term: "Jol", group: "Everyday chat", say: "jawl (South African English)", meaning: "A party or a really good time.", example: "That birthday was a proper jol.", source: dictionary("jol/e03505") },
  { term: "Now-now", aliases: "Now now", group: "Everyday chat", meaning: "In a moment, or a moment ago if you’re talking about something that already happened.", example: "I’ll be there now-now. I’m looking for parking.", source: dictionary("nownow/e05259") },
  { term: "Just now", group: "Everyday chat", meaning: "With a future plan, it can mean later or in a while. In the past tense it can mean a short time ago.", example: "I’ll wash the dishes just now. The match is nearly over.", source: dictionary("just-now/e03540") },
  { term: "Robot", group: "Everyday chat", meaning: "A traffic light in South African English.", example: "Turn left at the second robot.", source: dictionary("robot/e06032") },
  { term: "Bakkie", group: "Everyday chat", meaning: "A pickup truck. The word can also mean a small container in another context.", example: "We’ll need a bakkie to fetch that couch.", source: dictionary("bakkie/e00518") },
  { term: "Dala what you must", aliases: "Dala wat jy moet", group: "Everyday chat", region: cape, meaning: "Do what you need to do. It can encourage someone to take action or signal that the decision is theirs.", example: "If you’re ready to start your own thing, dala what you must.", source: "https://capecolouredculture.co.za/vocabulary/dala-what-you-must-meaning/" },
  { term: "Djy", aliases: "Jy", group: "Everyday chat", region: cape, meaning: "The Kaaps form of “you” in the singular.", example: "Waar gaan djy heen? (Where are you going?)", source: kaaps },
  { term: "Hoeko’", aliases: "Hoeko · Hoekom", group: "Everyday chat", region: cape, meaning: "“Why?” in Kaaps, with the final sound of hoekom dropped.", example: "Hoeko’ lag djy? (Why are you laughing?)", source: kaaps },
  { term: "Biesag", aliases: "Besig", group: "Everyday chat", region: cape, meaning: "A Kaaps form of the Afrikaans word for “busy”.", example: "Is djy biesag? (Are you busy?)", source: kaaps },
  { term: "Goetes", group: "Everyday chat", region: cape, meaning: "Things or stuff in Kaaps.", example: "Waar’s my goetes? (Where’s my stuff?)", source: kaaps },
  { term: "Pozi", aliases: "Pozie · Pozzie", group: "Everyday chat", region: kzn, meaning: "Someone’s home or place. Documented in South African Indian English.", example: "Come round to my pozi after the match.", source: indianEnglish },
  { term: "Choon", aliases: "Tune", group: "Everyday chat", region: kzn, meaning: "To talk or chat in Durban slang.", example: "Come sit. Let’s choon for a bit.", source: durban },
  { term: "Vaai", aliases: "Vy", group: "Everyday chat", region: kzn, meaning: "To go or leave, documented in South African Indian English.", example: "Let’s vaai before the rain starts.", source: indianEnglish },
  { term: "Graaf", group: "Everyday chat", region: kzn, meaning: "Work, in South African Indian English slang.", example: "I’ll see you after graaf.", source: indianEnglish },
  { term: "Guzzie", group: "Greetings & mates", region: kzn, meaning: "A friend or mate in Durban slang.", example: "I’m meeting my guzzie at the beach.", source: durban },
  { term: "Shot", group: "Greetings & mates", region: kzn, meaning: "A quick, informal thanks. Also used outside Durban.", example: "Shot for bringing my charger.", source: durban },
  { term: "Larney", aliases: "Larnie · Laanie", group: "Everyday chat", region: kzn, say: "LAH-nee", meaning: "Fancy, smart or posh. The older noun uses can be derogatory, so this example uses the adjective.", example: "That’s a larney jacket for a Tuesday.", source: dictionary("larney/e04243") },
  { term: "Umdyolo", group: "Everyday chat", region: easternCape, meaning: "A romantic relationship in Gqeberha isiXhosa. Researchers documented umjolo for the same meaning in Mthatha.", example: "So, how’s the umdyolo going?", source: xhosa },
  { term: "Umjolo", group: "Everyday chat", region: easternCape, meaning: "A romantic relationship, documented in Mthatha isiXhosa. Compare umdyolo, the Gqeberha form reported in the same study.", example: "She asked me how the umjolo was going.", source: xhosa },
  { term: "Veri", group: "Everyday chat", region: easternCape, meaning: "“Again” in Gqeberha isiXhosa, as reported by speakers in a study comparing Gqeberha and Mthatha.", example: "Veri? (Again?)", source: xhosa },
  { term: "Ikwati", group: "Food & get-togethers", region: easternCape, meaning: "A mug in Gqeberha isiXhosa. The same study recorded imagi for a mug in Mthatha.", example: "I’ll have tea in that big ikwati.", source: xhosa },
  { term: "Vaya", group: "Everyday chat", region: soweto, meaning: "To go or head off, documented in Soweto Iscamtho.", example: "Ke ya vaya. (I’m going.)", source: iscamtho },
  { term: "Sjoe", aliases: "Shu · Shoo", group: "Reactions", say: "shoo", meaning: "An exclamation of surprise, amazement or relief.", example: "Sjoe, we made it with a minute to spare.", source: dictionary("shu/e06441") },
  { term: "Yoh", aliases: "Yho", group: "Reactions", meaning: "An exclamation when something takes you by surprise or leaves you amazed.", example: "Yoh, look at the size of that queue.", source: graze },
  { term: "Hayibo", aliases: "Haibo", group: "Reactions", say: "hy-boh", meaning: "An exclamation of disbelief or surprise.", example: "Hayibo! You finished the whole puzzle already?", source: languageCentre },
  { term: "Eina", group: "Reactions", say: "AY-nah", meaning: "What you might say when something hurts. Think “ouch!”", example: "Eina! I caught my finger in the drawer.", source: languageCentre },
  { term: "Gatvol", group: "Reactions", say: "GHUT-foll (with a throaty first sound)", meaning: "Completely fed up. Informal and blunt.", example: "I’m gatvol of this printer eating my paper.", source: languageCentre },
  { term: "Ja, nee", aliases: "Ja nee", group: "Reactions", meaning: "Literally “yes, no”. In conversation the pair can signal agreement or acknowledgement.", example: "“That was a long week.” “Ja, nee. It really was.”", source: languageCentre },
  { term: "Jislaaik", group: "Reactions", say: "yis-like", meaning: "An exclamation of shock or surprise.", example: "Jislaaik, that thunder was loud!", source: languageCentre },
  { term: "Makoya", aliases: "The real makoya", group: "Reactions", say: "muh-KOY-uh", meaning: "The genuine article. You can use it to say something is the real deal.", example: "Homemade with her own recipe? That’s the real makoya.", source: dictionary("makoya/e10121") },
  { term: "Dinges", group: "Everyday chat", meaning: "A stand-in for the name of a thing you can’t quite remember.", example: "Pass me the dinges that opens the tin, please.", source: graze },
  { term: "Gooi", group: "Everyday chat", meaning: "Literally “throw” in Afrikaans. In casual speech it can mean to give or send something, or to get going.", example: "Gooi me the address when you get a chance.", source: tourism },
  { term: "Cav", group: "Everyday chat", meaning: "To notice, check out or understand something.", example: "Cav the new mural by the station.", source: graze },
  { term: "Grootman", group: "Greetings & mates", meaning: "A respectful way to address or refer to a man you look up to.", example: "Thanks for showing me how it’s done, grootman.", source: graze },
  { term: "Fundi", group: "Everyday chat", say: "FOON-dee", meaning: "Someone who really knows their subject.", example: "Ask our bike fundi why the brakes keep squeaking.", source: languageCentre },
  { term: "Laaitie", aliases: "Lytie", group: "Greetings & mates", say: "LIGHT-ee", meaning: "A youngster, often a young boy.", example: "I’ve supported this team since I was a laaitie.", source: languageCentre },
  { term: "Babbelas", group: "Everyday chat", say: "BUB-buh-lahs", meaning: "A hangover.", example: "That babbelas is why I’m staying on the couch.", source: languageCentre },
  { term: "Braai", group: "Food & get-togethers", say: "rhymes with rye", meaning: "Cooking over a fire or coals, or the gathering around it.", example: "We’re having a braai on Saturday. Bring a chair.", source: languageCentre },
  { term: "Bring and braai", group: "Food & get-togethers", meaning: "A braai where guests bring their own food or drinks and the host provides the fire and setup.", example: "It’s a bring and braai, so I’m bringing my own wors.", source: graze },
  { term: "Padkos", group: "Food & get-togethers", say: "PUTT-koss", meaning: "Food packed to eat on a journey.", example: "The padkos didn’t even make it to the first toll gate.", source: languageCentre },
  { term: "Laduma", group: "On the pitch", say: "lah-DOO-mah", meaning: "A celebratory shout when a goal is scored in football.", example: "The ball’s in the back of the net. Laduma!", source: languageCentre },
  { term: "Diski", group: "On the pitch", meaning: "Football or soccer, from township slang for the ball.", example: "There’s a game of diski at the park after school.", source: dictionary("diski/e10054") },
  { term: "Shibobo", group: "On the pitch", say: "shih-BAW-baw", meaning: "A football move where you put the ball between an opponent’s legs. Also called a nutmeg.", example: "One shibobo and she was through on goal.", source: dictionary("shibobo/e10123") },
  { term: "Sbali", aliases: "Sibali", group: "Greetings & mates", meaning: "Mate or friend in informal isiXhosa usage documented among young speakers.", example: "Sbali, are you coming to the match?", source: "https://files.eric.ed.gov/fulltext/ED402752.pdf" },
  { term: "Go gashle", aliases: "Go garshly", group: "Greetings & mates", say: "go GAHSH-lee (South African English)", meaning: "Go carefully or take it gently. It has also been recorded as a parting wish, like “go well”.", example: "Go gashle on that gravel road.", source: dictionary("gashle/e02565") },
  { term: "Skatul", group: "Everyday chat", region: kzn, meaning: "A shoe, documented in South African Indian English slang.", example: "I need a new skatul after that muddy walk.", source: indianEnglish },
  { term: "Oo’kant", aliases: "Ookant · Oorkant", group: "Everyday chat", region: cape, meaning: "Opposite or on the other side. A Kaaps form of oorkant.", example: "The shop is oo’kant, across from the taxi stop.", source: kaaps },
  { term: "Dintshang?", group: "Greetings & mates", region: pretoria, meaning: "An informal Sepitori greeting along the lines of “What’s up?”", example: "Dintshang? Haven’t seen you in ages.", source: tshwane },
  { term: "Feder", group: "Greetings & mates", region: pretoria, meaning: "A casual way to ask how someone is doing or what else is happening with them.", example: "Feder? What have you been up to lately?", source: tshwane },
  { term: "Dese", group: "Reactions", region: pretoria, meaning: "Cool or great in the Tshwane guide’s glossary of local speech.", example: "You got the tickets? Dese!", source: tshwane },
  { term: "Ku-million", aliases: "Ku-hundreds", group: "Reactions", region: pretoria, meaning: "A casual way of saying everything is fine.", example: "“Sorted for Saturday?” “Ku-million.”", source: tshwane },
  { term: "Dilo tsa ka di nametse RunX", aliases: "Dilo di nametse RunX", group: "Reactions", region: pretoria, meaning: "A playful way of saying things are going smoothly for you. Tshwane speakers in a study recognised this as Sepitori, township slang, or a mix of the two.", example: "New job, new place. Dilo tsa ka di nametse RunX.", source: sepitori },
  { term: "Pila pila", group: "Everyday chat", region: pretoria, meaning: "Actually or really in Sepitori. The single form pila can mean “well”.", example: "Pila pila, I didn’t understand the ending.", source: sepitoriNarratives },
  { term: "Spaneng", group: "Everyday chat", region: pretoria, meaning: "Work or a job, recorded in a spoken Sepitori narrative.", example: "I’ll call you when I get back from spaneng.", source: sepitoriNarratives },
  { term: "Entlek", group: "Everyday chat", region: pretoria, meaning: "Actually or in fact. Documented in Sepitori speech and in township slang elsewhere.", example: "Entlek, let’s take the earlier taxi.", source: sepitoriNarratives },
  { term: "Zozo", group: "Food & get-togethers", region: pretoria, meaning: "Food in township slang. Tshwane speakers used it in a study of Sepitori and Tsotsitaal.", example: "Let’s get some zozo before we head out.", source: sepitori },
  { term: "Stima mollo", group: "Food & get-togethers", region: pretoria, meaning: "Ice cubes in the Tshwane guide’s glossary of local speech.", example: "Can you add stima mollo to my drink?", source: tshwane },
  { term: "Sphatlo", aliases: "Kota", group: "Food & get-togethers", region: pretoria, meaning: "A quarter loaf of bread hollowed out and stuffed with fillings such as chips, meat or atchar.", example: "Let’s split a sphatlo before the game.", source: "https://repository.up.ac.za/bitstreams/07a3262e-e79e-4daf-bf0c-7ed4356b88fe/download" },
  { term: "Daai ding", group: "Everyday chat", region: pretoria, meaning: "“That thing.” It comes in handy when you want to point something out without naming it.", example: "Pass me daai ding by the kettle.", source: tshwane },
  { term: "Gedlela", group: "Everyday chat", region: pretoria, meaning: "A car in the Tshwane guide’s glossary of local speech.", example: "My gedlela is parked round the corner.", source: tshwane },
  { term: "Gereza", group: "Everyday chat", region: pretoria, meaning: "To hustle or get working on something.", example: "Time to gereza if we want to finish today.", source: tshwane },
  { term: "Lepopotane", group: "Everyday chat", region: pretoria, meaning: "A small, inexpensive phone.", example: "I keep a lepopotane as a spare.", source: tshwane },
  { term: "Jive", group: "Everyday chat", region: pretoria, meaning: "In this local sense, a problem or difficulty.", example: "Ke na le jive. (I have a problem.)", source: tshwane },
  { term: "Kasi", aliases: "Kasie", group: "Everyday chat", region: pretoria, say: "KAH-see", meaning: "A township or neighbourhood. The word is documented in Tshwane and is also used elsewhere in South Africa.", example: "There’s a football tournament in our kasi this weekend.", source: dictionary("kasi/e10115") },
  { term: "Ekasi", aliases: "eKasi · Ekasie", group: "Everyday chat", say: "eh-KAH-see", meaning: "In, to or from the township, depending on the sentence.", example: "I’m spending the weekend ekasi.", source: dictionary("ekasi/e10062") },
  { term: "Lefresha", group: "Everyday chat", region: limpopo, meaning: "A new student in campus slang documented in University of Limpopo research from 2009.", example: "I was a lefresha when I joined the debating club.", source: campus },
  { term: "Mzana", aliases: "Motsana", group: "Everyday chat", region: limpopo, meaning: "A women’s student residence in campus slang documented in University of Limpopo research from 2009.", example: "Meet me outside Mzana after class.", source: campus },
  { term: "Leansesta", group: "Everyday chat", region: limpopo, meaning: "A teasing campus term for a student who repeats courses and spends years at the institution. Documented in University of Limpopo research from 2009.", example: "They teased him about becoming a leansesta.", source: campus },
  { term: "Smeka", group: "Everyday chat", region: limpopo, meaning: "Money in campus slang documented in University of Limpopo research from 2009.", example: "I’m saving my smeka for the taxi home.", source: campus },
  { term: "Bra yanga", aliases: "Bra ya mina", group: "Greetings & mates", region: limpopo, meaning: "“My friend” or “my bro,” documented among young speakers in Vuwani.", example: "Bra yanga, how have you been?", source: vuwani },
  { term: "Mfana wanga", group: "Greetings & mates", region: limpopo, meaning: "A familiar way to address a friend, documented among young speakers in Vuwani.", example: "Mfana wanga, come sit with us.", source: vuwani },
  { term: "Madzhita", group: "Greetings & mates", region: limpopo, meaning: "A familiar way young men were reported to address one another in a study of Vuwani speech.", example: "Madzhita, are we still meeting later?", source: vuwani },
  { term: "Mungana", aliases: "Mugana", group: "Regional vocabulary", region: limpopo, meaning: "“Friend” in Tshironga, a variety of Tshivenḓa with words shared with Xitsonga.", example: "I’m bringing my mungana along.", source: tshironga },
  { term: "Kamunḓina", group: "Regional vocabulary", region: limpopo, meaning: "A Tshironga form of “you”, compared with inwi in standard Tshivenḓa.", example: "Kamunḓina is one local way of saying “you”.", source: tshironga },
  { term: "Ndaa", group: "Regional vocabulary", region: limpopo, say: "n-DAAH", meaning: "A conventional Tshivenḓa greeting traditionally used by men.", example: "Ndaa! (Hello!)", source: vendaLesson },
  { term: "Aa", group: "Regional vocabulary", region: limpopo, say: "AAH", meaning: "A conventional Tshivenḓa greeting traditionally used by women.", example: "Aa! (Hello!)", source: vendaLesson },
  { term: "Vho vuwa hani?", group: "Regional vocabulary", region: limpopo, say: "voh VOO-wah HAH-nee", meaning: "A Tshivenḓa greeting that asks how someone woke up.", example: "Vho vuwa hani? (How did you wake up?)", source: vendaLesson },
  { term: "Thobela", group: "Regional vocabulary", region: limpopo, say: "toh-BEH-lah", meaning: "A conventional Sepedi greeting.", example: "Thobela! (Hello!)", source: pediLesson },
  { term: "O kae?", group: "Regional vocabulary", region: limpopo, say: "oh KAH-eh", meaning: "A Sepedi way of asking how someone is.", example: "Thobela! O kae? (Hello! How are you?)", source: pediLesson },
  { term: "Avuxeni", group: "Regional vocabulary", region: limpopo, say: "ah-voo-sheh-nee", meaning: "A conventional Xitsonga greeting. Xitsonga is spoken in Limpopo and beyond.", example: "Avuxeni! (Hello!)", source: "https://app.honesthistory.co/collections/ua-issue-25/94b71354-503c-11ef-8060-42010a800016-pdzf" },
  { term: "Galla", aliases: "Gala · Gallah", group: "Everyday chat", say: "KHAH-lah (first sound like ch in loch)", meaning: "To crave something or look at it longingly. The dictionary records it especially in the Eastern Cape.", example: "I’m gallaing for a slice of that cake.", source: dictionary("galla/e02535") },
  { term: "Majita", aliases: "Mjita · Jita", group: "Greetings & mates", say: "mah-JEE-tah", meaning: "Guy or chap in township slang, from Isicamtho. It is also used in plural forms for a group of guys.", example: "The majitas are coming over to watch the match.", source: dictionary("majita/e04471") },
  { term: "Dladla", group: "Everyday chat", meaning: "A house or home in Tsotsitaal.", example: "We’re meeting at my dladla.", source: itsoseng },
  { term: "Nyuku", group: "Everyday chat", meaning: "Money in Tsotsitaal.", example: "I’m saving my nyuku for a new pair of shoes.", source: itsoseng },
  { term: "Authi", group: "Greetings & mates", meaning: "A guy around your age, or a male peer, in Tsotsitaal.", example: "My authi and I played in the same team.", source: itsoseng },
  { term: "Jaife", group: "Everyday chat", meaning: "Trouble or a problem in Tsotsitaal.", example: "We’ve got a jaife. The taxi’s already left.", source: itsoseng },
];

function renderSlangPage({ origin, stylesheet, navigation, footer, guestAdsScript, escapeHtml, escapeAttribute, escapeScript }) {
  const url = `${origin}/${SLANG_SLUG}/`;
  const title = "South African Slang | FreeHub";
  const description = "From awe ma se kind to sharp-sharp, explore South African slang with meanings, everyday examples and simple pronunciation hints.";
  const groups = [...new Set(entries.map(({ group }) => group))];
  const regions = [...new Set(entries.map(({ region }) => region).filter(Boolean))].sort();
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "South African slang", description, url, inLanguage: "en-ZA" };
  const cards = entries.map(({ term, aliases, group, region, say, meaning, example, source }) => {
    const audioEntry = dictionaryAudioByTerm.get(term);
    const audioUrl = audioEntry ? dictionary(audioEntry) : dictionaryAudioUrls.has(source) ? source : null;
    return `
        <article class="slang-card" data-slang-group="${escapeAttribute(group)}" data-slang-region="${escapeAttribute(region || "")}">
          <p class="slang-label">${escapeHtml(group)}</p>
          <h3>${escapeHtml(term)}</h3>
          ${region ? `<p class="slang-region">${escapeHtml(region)}</p>` : ""}
          ${aliases ? `<p class="slang-alias">${escapeHtml(aliases)}</p>` : ""}
          ${say ? `<p class="slang-sound"><strong>Sounds like</strong> ${escapeHtml(say)}</p>` : ""}
          ${term === "Bakkie" ? `<div class="slang-recording">
            <audio controls preload="none" aria-label="Play Bakkie pronunciation" src="${escapeAttribute(bakkieRecording.path)}"></audio>
            <p>South African English recording by <a href="${escapeAttribute(bakkieRecording.source)}">${escapeHtml(bakkieRecording.creator)}</a> · <a href="${escapeAttribute(bakkieRecording.license)}">CC BY-SA 4.0</a> · converted to MP3</p>
          </div>` : ""}
          ${audioUrl ? `<a class="slang-listen" href="${escapeAttribute(audioUrl)}"><span aria-hidden="true">▶</span> Listen on DSAE<span class="slang-visually-hidden"> to ${escapeHtml(term)}</span></a>` : ""}
          <p>${escapeHtml(meaning)}</p>
          <p class="slang-example">${escapeHtml(example)}</p>
          ${audioUrl !== source ? `<a href="${escapeAttribute(source)}">Source<span class="slang-visually-hidden"> for ${escapeHtml(term)}</span></a>` : ""}
        </article>`;
  }).join("");
  return `<!DOCTYPE html>
<html lang="en-ZA">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${escapeAttribute(description)}" />
  <link rel="canonical" href="${escapeAttribute(url)}" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="${escapeAttribute(stylesheet)}" />
  <link rel="stylesheet" href="/shared/slang.css" />
  <script type="application/ld+json">${escapeScript(JSON.stringify(schema))}</script>
  <script src="/shared/slang.js" defer></script>
  ${guestAdsScript}
</head>
<body>
  <div class="site-shell">
    ${navigation}
    <main class="main-content slang-page" id="main-content">
      <header class="slang-hero">
        <div>
          <p class="slang-label">FreeHub / Just for fun</p>
          <h1>South African slang</h1>
          <p>From a quick <em>sharp-sharp</em> to a heartfelt <em>eish</em>. Look up the words, try saying them out loud and see how they land in a sentence.</p>
          <a href="#slang-glossary">Explore the glossary ↓</a>
        </div>
        <div class="slang-greeting">
          <p>Awe<br />ma se kind!</p>
          <span>A warm hello between friends.</span>
        </div>
      </header>
      <details class="slang-quiz">
        <summary>Quick quiz · “Turn left at the robot.” What are you looking for?</summary>
        <p>A traffic light. If you were picturing a small metal person, fair enough.</p>
      </details>
      <section id="slang-glossary" aria-labelledby="slang-heading">
        <h2 id="slang-heading">Find a word or phrase</h2>
        <p>Explore ${entries.length} slang terms and everyday expressions. Regional labels show where a usage is documented. The Regional vocabulary category includes dialect words and conventional greetings. Sound hints are approximate.</p>
        <p>Use the player where it’s shown, or choose <strong>Listen on DSAE</strong> and press play beside the pronunciation on the Dictionary of South African English entry.</p>
        <div class="slang-filters" hidden>
          <label>Search the glossary <input type="search" placeholder="Try aweh or traffic light" /></label>
          <label>Category <select name="category"><option value="">All expressions</option>${groups.map((group) => `<option>${escapeHtml(group)}</option>`).join("")}</select></label>
          <label>Regional usage <select name="region"><option value="">All regions</option>${regions.map((region) => `<option>${escapeHtml(region)}</option>`).join("")}</select></label>
        </div>
        <p class="slang-status" role="status"></p>
        <div class="slang-grid">${cards}</div>
      </section>
    </main>
    ${footer}
  </div>
  <script type="module" src="/shared/auth-ui.js?v=20260917-account-save-v2"></script>
</body>
</html>`;
}

module.exports = { SLANG_SLUG, renderSlangPage };
