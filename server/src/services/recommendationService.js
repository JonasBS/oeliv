/**
 * Recommendation Service
 * Generates personalized experience recommendations based on guest data
 */

// ===========================================
// LÆRKEGAARDS EGNE TILBUD (Featured)
// Disse vises altid øverst og kan bookes direkte
// ===========================================
const FEATURED_EXPERIENCES = [
  {
    id: 'laerkegaard-sauna',
    category: 'featured',
    title: 'Privat sauna ved havet',
    subtitle: 'Eksklusiv for Lærkegaards gæster',
    description: 'Nyd vores private sauna med panoramaudsigt over Østersøen. Book 2 timer kun for jer selv. Håndklæder, vand og frugt inkluderet. Perfekt kombineret med et forfriskende havbad.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    duration: '2 timer',
    price: '450 kr',
    tags: ['eksklusiv', 'romantik', 'wellness', 'privat', 'hele-året'],
    occasions: ['romantik', 'jubilæum', 'bryllupsrejse', 'forlovelse', 'alle'],
    weather: ['alle'],
    guestTypes: ['par'],
    priceLevel: 2,
    romanticScore: 5,
    familyScore: 1,
    adventureScore: 2,
    cultureScore: 0,
    foodScore: 0,
    relaxScore: 5,
    featured: true,
    bookable: true,
    availableSlots: ['10:00', '13:00', '16:00', '19:00']
  },
  {
    id: 'laerkegaard-picnic',
    category: 'featured',
    title: 'Gourmet picnickurv',
    subtitle: 'Tag Bornholm med ud i naturen',
    description: 'Vi pakker en luksus picnickurv med lokale delikatesser: røget fisk, ost fra Bornholms Andelsmejeri, friskbagt brød, frugt og en flaske mousserende. Perfekt til stranden eller Hammeren.',
    image: 'https://images.unsplash.com/photo-1526484631228-d8c29adff45f?w=800&q=80',
    duration: 'Hele dagen',
    price: '395 kr for 2 pers.',
    tags: ['mad', 'romantik', 'natur', 'lokalt', 'sommer'],
    occasions: ['romantik', 'jubilæum', 'alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['par', 'venner'],
    priceLevel: 2,
    romanticScore: 5,
    familyScore: 3,
    adventureScore: 3,
    cultureScore: 2,
    foodScore: 5,
    relaxScore: 4,
    featured: true,
    bookable: true,
    bookingNotice: 'Bestilles dagen før inden kl. 18:00'
  },
  {
    id: 'laerkegaard-morgenmad',
    category: 'featured',
    title: 'Morgenmad på terrassen',
    subtitle: 'Start dagen med udsigt',
    description: 'Fuld bornholmsk morgenmad serveret på vores terrasse med havudsigt. Friskpresset juice, varme boller, æg, røget laks, ost og meget mere. Kaffe og te ad libitum.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    duration: '1-2 timer',
    price: '195 kr pr. person',
    tags: ['morgenmad', 'lokalt', 'hygge', 'udsigt'],
    occasions: ['alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['alle'],
    priceLevel: 2,
    romanticScore: 4,
    familyScore: 5,
    adventureScore: 0,
    cultureScore: 2,
    foodScore: 5,
    relaxScore: 5,
    featured: true,
    bookable: true,
    bookingNotice: 'Bestilles aftenen før'
  },
  {
    id: 'laerkegaard-cykel',
    category: 'featured',
    title: 'Lån af el-cykler',
    subtitle: 'Udforsk øen ubesværet',
    description: 'Vi har 4 kvalitets el-cykler til rådighed for vores gæster. Perfekt til at udforske Bornholms 230+ km cykelstier uden at blive træt. Hjelme, lås og kort inkluderet.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    duration: 'Hel dag',
    price: '250 kr / cykel / dag',
    tags: ['aktiv', 'natur', 'frihed', 'forår-efterår'],
    occasions: ['alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['alle'],
    priceLevel: 2,
    romanticScore: 3,
    familyScore: 4,
    adventureScore: 4,
    cultureScore: 2,
    foodScore: 0,
    relaxScore: 3,
    featured: true,
    bookable: true,
    limited: true,
    availableCount: 4
  },
  {
    id: 'laerkegaard-champagne',
    category: 'featured',
    title: 'Champagne & jordbær',
    subtitle: 'Overraskelse på værelset',
    description: 'Lad os overraske din partner! Vi sætter en flaske champagne og friske bornholmske jordbær klar på værelset inden ankomst. Perfekt til særlige anledninger.',
    image: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&q=80',
    price: '495 kr',
    tags: ['romantik', 'overraskelse', 'fejring', 'luksus'],
    occasions: ['jubilæum', 'bryllupsrejse', 'forlovelse', 'fødselsdag'],
    weather: ['alle'],
    guestTypes: ['par'],
    priceLevel: 3,
    romanticScore: 5,
    familyScore: 0,
    adventureScore: 0,
    cultureScore: 0,
    foodScore: 3,
    relaxScore: 4,
    featured: true,
    bookable: true,
    bookingNotice: 'Bestilles mindst 24 timer før'
  },
  {
    id: 'laerkegaard-massage',
    category: 'featured',
    title: 'Massage på værelset',
    subtitle: 'Professionel afspænding',
    description: 'Vores samarbejdspartner kommer til dit værelse og giver dig en afslappende massage. Vælg mellem klassisk svensk massage, hot stone eller aromaterapi. 60 eller 90 minutter.',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    duration: '60-90 min',
    price: '695-995 kr',
    tags: ['wellness', 'afslapning', 'luksus', 'hele-året'],
    occasions: ['romantik', 'jubilæum', 'bryllupsrejse', 'alle'],
    weather: ['alle'],
    guestTypes: ['par', 'solo'],
    priceLevel: 3,
    romanticScore: 4,
    familyScore: 0,
    adventureScore: 0,
    cultureScore: 0,
    foodScore: 0,
    relaxScore: 5,
    featured: true,
    bookable: true,
    bookingNotice: 'Book mindst 2 dage før'
  },
  {
    id: 'laerkegaard-sunset',
    category: 'featured',
    title: 'Solnedgangstur med guide',
    subtitle: 'Oplev Hammeren ved solnedgang',
    description: 'Vores lokale guide tager jer med på en aftenvandring til Bornholms bedste solnedgangsspot. Undervejs fortælles historier om øen. Afslut med et glas bobler på klippen.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    duration: '2-3 timer',
    price: '350 kr pr. person',
    tags: ['guidet', 'romantik', 'natur', 'udsigt', 'sommer'],
    occasions: ['romantik', 'jubilæum', 'bryllupsrejse', 'alle'],
    weather: ['sol'],
    guestTypes: ['par', 'venner'],
    priceLevel: 2,
    romanticScore: 5,
    familyScore: 2,
    adventureScore: 3,
    cultureScore: 3,
    foodScore: 1,
    relaxScore: 4,
    featured: true,
    bookable: true,
    seasonal: true,
    availableMonths: [5, 6, 7, 8, 9]
  },
  {
    id: 'laerkegaard-kajak',
    category: 'featured',
    title: 'Guidet kajaktur',
    subtitle: 'Udforsk kysten fra vandet',
    description: 'Oplev de dramatiske klipper fra havets perspektiv. Vores erfarne guide tager jer med på en sikker og spændende tur langs nordkysten. Alt udstyr og instruktion inkluderet.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    duration: '3 timer',
    price: '495 kr pr. person',
    tags: ['eventyr', 'aktiv', 'natur', 'guidet', 'sommer'],
    occasions: ['alle'],
    weather: ['sol'],
    guestTypes: ['par', 'venner', 'aktive'],
    priceLevel: 2,
    romanticScore: 3,
    familyScore: 2,
    adventureScore: 5,
    cultureScore: 1,
    foodScore: 0,
    relaxScore: 2,
    featured: true,
    bookable: true,
    seasonal: true,
    availableMonths: [5, 6, 7, 8, 9]
  },
  {
    id: 'hammerhavn-havkajak',
    category: 'featured',
    title: 'Havkajaktur ved Hammerhavn',
    subtitle: 'Eventyr langs de dramatiske klipper',
    description: 'Start fra den idylliske Hammerhavn og padle langs Bornholms mest spektakulære kystlinje. Se Hammershus fra vandet, udforsk grotter og nyd det krystalklare vand. Guidet tur med alt udstyr inkluderet.',
    image: 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=800&q=80',
    duration: '2-3 timer',
    price: '550 kr pr. person',
    tags: ['eventyr', 'aktiv', 'natur', 'guidet', 'unik', 'sommer'],
    occasions: ['alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['par', 'venner', 'aktive'],
    priceLevel: 3,
    romanticScore: 4,
    familyScore: 2,
    adventureScore: 5,
    cultureScore: 2,
    foodScore: 0,
    relaxScore: 2,
    featured: true,
    bookable: true,
    seasonal: true,
    availableMonths: [5, 6, 7, 8, 9],
    bookingNotice: 'Book mindst 1 dag før. Kræver svømmekundskaber.'
  },
  {
    id: 'laerkegaard-beer-tasting',
    category: 'featured',
    title: 'Lærkegaard Beer Tasting',
    subtitle: 'Smagning af bornholmske øl',
    description: 'Oplev en guidet ølsmagning hos Lærkegaard med udvalgte bornholmske håndværksøl. Vores ølkender fortæller om øens bryggeritraditioner, mens I smager 5 forskellige øl parret med lokale oste og snacks. Hyggeligt og lærerigt.',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80',
    duration: '1,5 timer',
    price: '345 kr pr. person',
    tags: ['mad', 'lokalt', 'hygge', 'aften', 'voksne', 'smagning'],
    occasions: ['venner', 'par', 'alle'],
    weather: ['alle'],
    guestTypes: ['par', 'venner', 'solo'],
    priceLevel: 2,
    romanticScore: 3,
    familyScore: 0,
    adventureScore: 1,
    cultureScore: 4,
    foodScore: 5,
    relaxScore: 4,
    featured: true,
    bookable: true,
    availableSlots: ['17:00', '19:30'],
    bookingNotice: 'Min. 2 personer. Book senest dagen før.'
  },
  {
    id: 'oelstauan',
    category: 'featured',
    title: 'Ølstauan',
    subtitle: 'Autentisk bornholmsk ølkultur',
    description: 'Besøg Bornholms hyggeligste ølbar i Allinge. Smag lokale håndværksøl, lær om øens bryggeritradition og nyd den afslappede atmosfære. Vi arrangerer smagning med ølekspert for vores gæster.',
    image: 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800&q=80',
    duration: '2 timer',
    price: '295 kr pr. person',
    tags: ['mad', 'lokalt', 'hygge', 'aften', 'voksne'],
    occasions: ['venner', 'par', 'alle'],
    weather: ['alle'],
    guestTypes: ['par', 'venner', 'solo'],
    priceLevel: 2,
    romanticScore: 2,
    familyScore: 0,
    adventureScore: 1,
    cultureScore: 4,
    foodScore: 5,
    relaxScore: 4,
    featured: true,
    bookable: true,
    bookingNotice: 'Smagning kræver min. 2 personer'
  },
  {
    id: 'levertranfabrikken',
    category: 'featured',
    title: 'Levertranfabrikken Allinge',
    subtitle: 'Kultur & gastronomi i historiske rammer',
    description: 'Den gamle levertranfabrik er omdannet til et unikt kultursted med restaurant, galleri og events. Nyd fantastisk mad med lokale råvarer i industrielle omgivelser med havudsigt. En ægte bornholmsk oplevelse.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    duration: '2-3 timer',
    price: 'Fra 350 kr pr. person',
    tags: ['mad', 'kultur', 'historie', 'udsigt', 'romantik'],
    occasions: ['romantik', 'jubilæum', 'alle'],
    weather: ['alle'],
    guestTypes: ['par', 'venner', 'familie'],
    priceLevel: 3,
    romanticScore: 4,
    familyScore: 3,
    adventureScore: 1,
    cultureScore: 4,
    foodScore: 5,
    relaxScore: 4,
    featured: true,
    bookable: true,
    bookingNotice: 'Bordreservation anbefales'
  },
  {
    id: 'tovbanen-opalsoen',
    category: 'featured',
    title: 'Tovbanen ved Opalsøen',
    subtitle: 'Unik naturattraktion',
    description: 'Oplev den historiske tovbane ved den smukke Opalsø i granitbruddet. Tag med på en guidet tur og hør om Bornholms industri-historie, mens I nyder det turkisblå vand omgivet af dramatiske klippevægge.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    duration: '1-2 timer',
    price: '150 kr pr. person',
    tags: ['natur', 'historie', 'unik', 'familie', 'foto'],
    occasions: ['alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['familie', 'par', 'venner'],
    priceLevel: 1,
    romanticScore: 3,
    familyScore: 5,
    adventureScore: 3,
    cultureScore: 4,
    foodScore: 0,
    relaxScore: 3,
    featured: true,
    bookable: true,
    seasonal: true,
    availableMonths: [4, 5, 6, 7, 8, 9, 10]
  }
];

// ===========================================
// EKSTERNE OPLEVELSER (Partnere & Området)
// ===========================================
const EXPERIENCES = [
  // NATUR
  {
    id: 'hammershus',
    category: 'natur',
    title: 'Hammershus Slotsruin',
    subtitle: 'Nordeuropas største borgruin',
    image: 'https://images.unsplash.com/photo-1599413987323-b2b8c0d7d9c8?w=800&q=80',
    distance: '3 km',
    duration: '1-2 timer',
    tags: ['must-see', 'historie', 'familie', 'gratis', 'hele-året', 'first-time', 'aktiv'],
    occasions: ['alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['familie', 'par', 'solo', 'venner'],
    priceLevel: 0,
    romanticScore: 3,
    familyScore: 5,
    adventureScore: 3,
    cultureScore: 5,
    foodScore: 0,
    relaxScore: 2,
    highlight: true
  },
  {
    id: 'hammeren',
    category: 'natur',
    title: 'Hammerknuden & Hammeren',
    subtitle: 'Dramatisk klippelandskab',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    distance: '4 km',
    duration: '2-4 timer',
    tags: ['natur', 'vandring', 'udsigt', 'gratis', 'hele-året', 'aktiv', 'fotogent'],
    occasions: ['alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['par', 'solo', 'venner', 'aktive'],
    priceLevel: 0,
    romanticScore: 5,
    familyScore: 3,
    adventureScore: 4,
    cultureScore: 2,
    foodScore: 0,
    relaxScore: 4,
    highlight: true
  },
  {
    id: 'sandvig-strand',
    category: 'natur',
    title: 'Sandvig Strand',
    subtitle: 'Hvidt sand og klart vand',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    distance: '2 km',
    duration: '∞',
    tags: ['strand', 'afslapning', 'familie', 'gratis', 'sommer'],
    occasions: ['alle'],
    weather: ['sol'],
    guestTypes: ['familie', 'par', 'venner'],
    priceLevel: 0,
    romanticScore: 4,
    familyScore: 5,
    adventureScore: 2,
    cultureScore: 0,
    foodScore: 0,
    relaxScore: 5,
    highlight: true
  },
  {
    id: 'opalsoen',
    category: 'natur',
    title: 'Opalsøen',
    subtitle: 'Den hemmelige blå sø',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    distance: '5 km',
    duration: '1 time',
    tags: ['hemmelighed', 'fotogent', 'unik', 'gratis', 'hele-året'],
    occasions: ['romantik', 'alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['par', 'solo', 'venner'],
    priceLevel: 0,
    romanticScore: 5,
    familyScore: 2,
    adventureScore: 4,
    cultureScore: 1,
    foodScore: 0,
    relaxScore: 4,
    highlight: true
  },
  {
    id: 'solnedgang-hammeren',
    category: 'wellness',
    title: 'Solnedgang ved Hammeren',
    subtitle: 'Magisk aftenstemning',
    image: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80',
    distance: '4 km',
    duration: '1-2 timer',
    tags: ['romantik', 'gratis', 'udsigt', 'aften', 'sommer'],
    occasions: ['romantik', 'jubilæum', 'bryllupsrejse', 'forlovelse'],
    weather: ['sol'],
    guestTypes: ['par'],
    priceLevel: 0,
    romanticScore: 5,
    familyScore: 2,
    adventureScore: 2,
    cultureScore: 1,
    foodScore: 0,
    relaxScore: 5,
    highlight: true
  },

  // MAD & DRIKKE
  {
    id: 'kadeau',
    category: 'mad',
    title: 'Kadeau Bornholm',
    subtitle: '2 Michelin-stjerner',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    distance: '25 km',
    price: '2.500-3.500 kr',
    tags: ['michelin', 'gourmet', 'ekslusiv', 'romantik', 'foodie'],
    occasions: ['jubilæum', 'bryllupsrejse', 'forlovelse', 'fødselsdag'],
    weather: ['alle'],
    guestTypes: ['par', 'vip', 'foodie'],
    priceLevel: 5,
    romanticScore: 5,
    familyScore: 1,
    adventureScore: 2,
    cultureScore: 3,
    foodScore: 5,
    relaxScore: 4,
    highlight: true
  },
  {
    id: 'stammershalle',
    category: 'mad',
    title: 'Stammershalle Badehotel',
    subtitle: 'Klassisk dansk frokost med havudsigt',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    distance: '8 km',
    price: '300-600 kr',
    tags: ['klassisk', 'havudsigt', 'frokost', 'hygge'],
    occasions: ['alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['par', 'familie', 'venner'],
    priceLevel: 3,
    romanticScore: 4,
    familyScore: 4,
    adventureScore: 1,
    cultureScore: 3,
    foodScore: 4,
    relaxScore: 4
  },
  {
    id: 'nordbornholms-rogeri',
    category: 'mad',
    title: 'Nordbornholms Røgeri',
    subtitle: 'Ægte bornholmsk røget fisk',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
    distance: '1 km',
    price: '100-200 kr',
    tags: ['lokalt', 'autentisk', 'frokost', 'must-try', 'first-time'],
    occasions: ['alle'],
    weather: ['alle'],
    guestTypes: ['alle'],
    priceLevel: 1,
    romanticScore: 2,
    familyScore: 4,
    adventureScore: 2,
    cultureScore: 4,
    foodScore: 5,
    relaxScore: 3
  },
  {
    id: 'le-port',
    category: 'mad',
    title: 'Le Port',
    subtitle: 'Fransk-inspireret i Gudhjem',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    distance: '10 km',
    price: '400-700 kr',
    tags: ['romantik', 'aften', 'fransk', 'hygge'],
    occasions: ['jubilæum', 'romantik', 'forlovelse'],
    weather: ['alle'],
    guestTypes: ['par'],
    priceLevel: 3,
    romanticScore: 5,
    familyScore: 2,
    adventureScore: 1,
    cultureScore: 2,
    foodScore: 4,
    relaxScore: 4
  },
  {
    id: 'svaneke-bryghus',
    category: 'mad',
    title: 'Svaneke Bryghus',
    subtitle: 'Prisvindende øl & mad',
    image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80',
    distance: '20 km',
    price: '150-350 kr',
    tags: ['øl', 'hygge', 'lokalt', 'venner'],
    occasions: ['alle'],
    weather: ['alle'],
    guestTypes: ['venner', 'par'],
    priceLevel: 2,
    romanticScore: 2,
    familyScore: 2,
    adventureScore: 2,
    cultureScore: 3,
    foodScore: 4,
    relaxScore: 3
  },
  {
    id: 'kalas',
    category: 'mad',
    title: 'Kalas',
    subtitle: 'Is & kaffe i Allinge',
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80',
    distance: '500 m',
    price: '40-80 kr',
    tags: ['is', 'sommer', 'familie', 'hygge', 'tæt-på'],
    occasions: ['alle'],
    weather: ['sol'],
    guestTypes: ['familie', 'par', 'alle'],
    priceLevel: 1,
    romanticScore: 2,
    familyScore: 5,
    adventureScore: 1,
    cultureScore: 1,
    foodScore: 3,
    relaxScore: 3
  },

  // KULTUR
  {
    id: 'bornholms-kunstmuseum',
    category: 'kultur',
    title: 'Bornholms Kunstmuseum',
    subtitle: 'Kunst med udsigt',
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80',
    distance: '12 km',
    duration: '1-2 timer',
    price: '100 kr',
    tags: ['kunst', 'arkitektur', 'kultur', 'hele-året', 'regn'],
    occasions: ['alle'],
    weather: ['alle', 'regn'],
    guestTypes: ['par', 'solo', 'kultur'],
    priceLevel: 1,
    romanticScore: 3,
    familyScore: 2,
    adventureScore: 1,
    cultureScore: 5,
    foodScore: 0,
    relaxScore: 4
  },
  {
    id: 'gudhjem',
    category: 'kultur',
    title: 'Gudhjem by',
    subtitle: 'Bornholms perle',
    image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&q=80',
    distance: '10 km',
    duration: '2-3 timer',
    tags: ['bytur', 'shopping', 'hygge', 'hele-året', 'first-time'],
    occasions: ['alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['alle'],
    priceLevel: 0,
    romanticScore: 4,
    familyScore: 4,
    adventureScore: 2,
    cultureScore: 4,
    foodScore: 3,
    relaxScore: 4
  },
  {
    id: 'rundkirker',
    category: 'kultur',
    title: 'Bornholms Rundkirker',
    subtitle: 'Unikke middelalderkirker',
    image: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800&q=80',
    distance: '8-20 km',
    duration: '2-4 timer',
    tags: ['historie', 'arkitektur', 'unik', 'hele-året', 'first-time'],
    occasions: ['alle'],
    weather: ['alle'],
    guestTypes: ['par', 'familie', 'kultur'],
    priceLevel: 0,
    romanticScore: 2,
    familyScore: 3,
    adventureScore: 2,
    cultureScore: 5,
    foodScore: 0,
    relaxScore: 2
  },
  {
    id: 'svaneke',
    category: 'kultur',
    title: 'Svaneke',
    subtitle: 'Danmarks smukkeste købstad',
    image: 'https://images.unsplash.com/photo-1555952517-2e8e729e0b44?w=800&q=80',
    distance: '20 km',
    duration: '3-4 timer',
    tags: ['bytur', 'shopping', 'hygge', 'hele-året'],
    occasions: ['alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['alle'],
    priceLevel: 0,
    romanticScore: 4,
    familyScore: 4,
    adventureScore: 2,
    cultureScore: 4,
    foodScore: 3,
    relaxScore: 4
  },

  // WELLNESS
  {
    id: 'nordlandet',
    category: 'wellness',
    title: 'NordlandetSpa',
    subtitle: 'Spa med havudsigt',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    duration: '2-4 timer',
    price: '400-1.500 kr',
    tags: ['spa', 'wellness', 'afslapning', 'hele-året'],
    occasions: ['romantik', 'jubilæum', 'bryllupsrejse'],
    weather: ['alle', 'regn'],
    guestTypes: ['par'],
    priceLevel: 3,
    romanticScore: 5,
    familyScore: 1,
    adventureScore: 0,
    cultureScore: 0,
    foodScore: 0,
    relaxScore: 5
  },

  // AKTIVITETER
  {
    id: 'kajak-allinge',
    category: 'aktivitet',
    title: 'Havkajak fra Allinge',
    subtitle: 'Udforsk kysten fra vandet',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    duration: '2-4 timer',
    price: '350-700 kr',
    tags: ['eventyr', 'aktiv', 'vand', 'sommer'],
    occasions: ['alle'],
    weather: ['sol'],
    guestTypes: ['par', 'venner', 'aktive'],
    priceLevel: 2,
    romanticScore: 3,
    familyScore: 2,
    adventureScore: 5,
    cultureScore: 1,
    foodScore: 0,
    relaxScore: 2
  },
  {
    id: 'cykeltur',
    category: 'natur',
    title: 'Cykeltur på Bornholm',
    subtitle: 'Udforsk øen på to hjul',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    distance: 'Varierer',
    duration: '2-6 timer',
    tags: ['aktiv', 'natur', 'frihed', 'forår-efterår'],
    occasions: ['alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['par', 'familie', 'venner', 'aktive'],
    priceLevel: 1,
    romanticScore: 3,
    familyScore: 4,
    adventureScore: 4,
    cultureScore: 2,
    foodScore: 0,
    relaxScore: 3
  },
  {
    id: 'christiansoe',
    category: 'mad',
    title: 'Christiansø Kro',
    subtitle: 'Frokost på ærteøen',
    image: 'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800&q=80',
    distance: 'Færge fra Gudhjem',
    price: '200-400 kr + færge',
    duration: 'Heldagstur',
    tags: ['udflugt', 'unik', 'historie', 'eventyr', 'first-time'],
    occasions: ['alle'],
    weather: ['sol', 'overskyet'],
    guestTypes: ['par', 'venner', 'eventyr'],
    priceLevel: 2,
    romanticScore: 4,
    familyScore: 3,
    adventureScore: 5,
    cultureScore: 4,
    foodScore: 3,
    relaxScore: 3,
    highlight: true
  }
];

/**
 * Get current season
 */
const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 3 && month <= 5) return 'forår';
  if (month >= 6 && month <= 8) return 'sommer';
  if (month >= 9 && month <= 10) return 'efterår';
  return 'vinter';
};

/**
 * Map occasion type to tags
 */
const mapOccasionToTags = (occasionType) => {
  const mapping = {
    'birthday': ['fødselsdag', 'fejring'],
    'anniversary': ['jubilæum', 'romantik'],
    'honeymoon': ['bryllupsrejse', 'romantik'],
    'proposal': ['forlovelse', 'romantik'],
    'other': ['fejring']
  };
  return mapping[occasionType] || [];
};

/**
 * Calculate recommendation score for an experience
 */
const calculateScore = (experience, guestProfile) => {
  let score = 0;
  const weights = {
    occasion: 25,
    guestType: 20,
    preferences: 20,
    firstTime: 15,
    weather: 10,
    returning: 10
  };

  // 1. Occasion matching (highest weight)
  if (guestProfile.occasion) {
    if (experience.occasions.includes(guestProfile.occasion) || 
        experience.occasions.includes('alle')) {
      score += weights.occasion;
    }
    // Extra boost for romantic occasions
    if (['anniversary', 'honeymoon', 'proposal'].includes(guestProfile.occasion)) {
      score += experience.romanticScore * 3;
    }
  }

  // 2. Guest type matching
  if (guestProfile.guestCount) {
    if (guestProfile.guestCount >= 3 && experience.familyScore >= 4) {
      score += weights.guestType;
    } else if (guestProfile.guestCount === 2 && experience.romanticScore >= 4) {
      score += weights.guestType;
    }
  }

  // 3. VIP/Loyal guest - prefer premium experiences
  if (guestProfile.segment === 'vip' || guestProfile.segment === 'loyal') {
    if (experience.priceLevel >= 3) {
      score += 15;
    }
  }

  // 4. First time visitor - must-see experiences
  if (guestProfile.isFirstVisit && experience.tags.includes('first-time')) {
    score += weights.firstTime;
  }

  // 5. Returning guest - suggest NEW experiences they haven't seen
  if (guestProfile.previousExperiences && guestProfile.previousExperiences.length > 0) {
    if (!guestProfile.previousExperiences.includes(experience.id)) {
      score += weights.returning;
    } else {
      score -= 20; // Penalize already-visited
    }
  }

  // 6. Dietary preferences matching for food experiences
  if (experience.category === 'mad' && guestProfile.hasDietaryRequirements) {
    // Boost local/flexible restaurants
    if (experience.tags.includes('lokalt')) {
      score += 5;
    }
  }

  // 7. Breakfast preference - boost food experiences
  if (guestProfile.wantsBreakfastInRoom === false && experience.category === 'mad') {
    score += 5;
  }

  // 8. Activity level based on preferences
  if (guestProfile.wantsRelaxation) {
    score += experience.relaxScore * 2;
  }

  // 9. Weather consideration (simulated - could use real API)
  const season = getCurrentSeason();
  if (season === 'sommer' && experience.tags.includes('sommer')) {
    score += weights.weather;
  } else if (season === 'vinter' && experience.tags.includes('hele-året')) {
    score += weights.weather;
  }

  // 10. Proximity bonus (closer = better for short stays)
  if (experience.distance) {
    const distanceNum = parseFloat(experience.distance);
    if (!isNaN(distanceNum) && distanceNum <= 5) {
      score += 5;
    }
  }

  return score;
};

/**
 * Generate personalized recommendations
 */
export const getPersonalizedRecommendations = async (guestProfile) => {
  // Score all experiences
  const scoredExperiences = EXPERIENCES.map(exp => ({
    ...exp,
    score: calculateScore(exp, guestProfile),
    personalReason: generatePersonalReason(exp, guestProfile)
  }));

  // Sort by score
  scoredExperiences.sort((a, b) => b.score - a.score);

  // Get top recommendations (6-8)
  const topRecommendations = scoredExperiences.slice(0, 8);

  // Group by category for variety
  const categories = {};
  const finalRecommendations = [];
  
  for (const exp of topRecommendations) {
    if (!categories[exp.category]) {
      categories[exp.category] = 0;
    }
    // Max 2 per category for variety
    if (categories[exp.category] < 2) {
      finalRecommendations.push(exp);
      categories[exp.category]++;
    }
    if (finalRecommendations.length >= 6) break;
  }

  return {
    recommendations: finalRecommendations,
    guestName: guestProfile.guestName,
    isFirstVisit: guestProfile.isFirstVisit,
    occasion: guestProfile.occasion,
    segment: guestProfile.segment,
    personalGreeting: generateGreeting(guestProfile)
  };
};

/**
 * Generate personal reason for recommendation
 */
const generatePersonalReason = (experience, guestProfile) => {
  const reasons = [];

  if (guestProfile.occasion === 'anniversary' && experience.romanticScore >= 4) {
    reasons.push('Perfekt til jeres jubilæum');
  } else if (guestProfile.occasion === 'honeymoon' && experience.romanticScore >= 4) {
    reasons.push('Ideel til bryllupsrejsen');
  } else if (guestProfile.occasion === 'birthday') {
    reasons.push('Fejr fødselsdagen her');
  }

  if (guestProfile.isFirstVisit && experience.tags.includes('first-time')) {
    reasons.push('Et must-see på Bornholm');
  }

  if (guestProfile.segment === 'vip' && experience.priceLevel >= 4) {
    reasons.push('Eksklusiv oplevelse til dig');
  }

  if (guestProfile.guestCount >= 3 && experience.familyScore >= 4) {
    reasons.push('Familievenlig');
  }

  if (experience.distance && parseFloat(experience.distance) <= 3) {
    reasons.push('Tæt på Lærkegaard');
  }

  return reasons[0] || null;
};

/**
 * Generate personalized greeting
 */
const generateGreeting = (guestProfile) => {
  const firstName = guestProfile.guestName?.split(' ')[0] || 'gæst';
  
  if (guestProfile.segment === 'vip') {
    return `Velkommen tilbage, ${firstName}! Som vores værdifulde gæst har vi udvalgt nogle særlige oplevelser til dig.`;
  }
  
  if (guestProfile.segment === 'loyal') {
    return `Så dejligt at se dig igen, ${firstName}! Her er nye oplevelser du måske vil elske.`;
  }
  
  if (guestProfile.occasion === 'anniversary') {
    return `Tillykke med jubilæet, ${firstName}! Vi har samlet de mest romantiske oplevelser til jer.`;
  }
  
  if (guestProfile.occasion === 'honeymoon') {
    return `Tillykke med brylluppet! Her er vores anbefalinger til en uforglemmelig bryllupsrejse.`;
  }
  
  if (guestProfile.occasion === 'birthday') {
    return `Tillykke med fødselsdagen, ${firstName}! Gør dagen ekstra speciel med disse oplevelser.`;
  }
  
  if (guestProfile.isFirstVisit) {
    return `Velkommen til Bornholm, ${firstName}! Her er de oplevelser du ikke må gå glip af.`;
  }
  
  return `Hej ${firstName}! Her er vores personlige anbefalinger til dit ophold.`;
};

/**
 * Get all experiences (for full guide)
 */
export const getAllExperiences = () => {
  return {
    featured: FEATURED_EXPERIENCES,
    experiences: EXPERIENCES
  };
};

/**
 * Get featured experiences (Lærkegaards egne tilbud)
 */
export const getFeaturedExperiences = () => {
  return FEATURED_EXPERIENCES;
};

/**
 * Get personalized featured recommendations
 */
export const getPersonalizedFeatured = (guestProfile) => {
  const scoredFeatured = FEATURED_EXPERIENCES.map(exp => ({
    ...exp,
    score: calculateScore(exp, guestProfile),
    personalReason: generatePersonalReason(exp, guestProfile)
  }));

  scoredFeatured.sort((a, b) => b.score - a.score);
  
  // Return top 4 featured that match the guest
  return scoredFeatured.slice(0, 4);
};

/**
 * Enhanced personalized recommendations including featured
 */
export const getFullPersonalizedGuide = async (guestProfile) => {
  // Get personalized featured (Lærkegaards egne)
  const personalizedFeatured = getPersonalizedFeatured(guestProfile);
  
  // Get personalized external experiences
  const { recommendations } = await getPersonalizedRecommendations(guestProfile);
  
  return {
    guestName: guestProfile.guestName,
    isFirstVisit: guestProfile.isFirstVisit,
    occasion: guestProfile.occasion,
    segment: guestProfile.segment,
    personalGreeting: generateGreeting(guestProfile),
    featured: personalizedFeatured,
    recommendations: recommendations,
    allFeatured: FEATURED_EXPERIENCES,
    allExperiences: EXPERIENCES
  };
};

export default {
  getPersonalizedRecommendations,
  getAllExperiences,
  getFeaturedExperiences,
  getPersonalizedFeatured,
  getFullPersonalizedGuide
};

