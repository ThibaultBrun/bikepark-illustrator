// Euskara — traduction best-effort, à faire relire par un locuteur natif.
export default {
  app: { name: 'Bikepark Illustrator' },
  common: { cancel: 'Utzi', close: 'Itxi', delete: 'Ezabatu', new: 'Berria' },
  lang: { label: 'Hizkuntza', fr: 'Français', en: 'English', es: 'Español', eu: 'Euskara' },

  login: {
    tagline: 'Hasi saioa zure Pista kontuarekin zure spot-ak sortu eta bidaltzeko.',
    google: 'Jarraitu Google-rekin',
    or: 'edo',
    email: 'Posta elektronikoa',
    password: 'Pasahitza',
    signin: 'Saioa hasi',
    signup: 'Kontua sortu',
    toSignup: 'Konturik ez duzu oraindik? Izena eman',
    toSignin: 'Baduzu kontua? Hasi saioa',
    accountCreated: 'Kontua sortu da. Egiaztatu zure posta berrespena eskatzen bada.',
    errInvalid: 'Posta edo pasahitz okerra.',
    errExists: 'Posta honek badu kontua jada.',
  },

  account: { logout: 'Saioa itxi' },
  loading: 'Kargatzen…',

  sections: {
    track: { title: 'Pistak', desc: 'Inportatu eta estilizatu GPX ibilbideak.' },
    symbol: { title: 'Sinboloak', desc: 'Prestatu ikonoak eta markatzaileak.' },
    map: { title: 'Mapa', desc: 'Doitu oinarri-mapa eta ikus-aukerak.' },
    locate: { title: 'Kokatu', desc: 'Bilatu helbide edo leku bat.' },
    export: { title: 'Esportatu', desc: 'Prestatu azken irteerak eta esportazioak.' },
    help: { title: 'Laguntza', desc: 'Bisita gidatua eta funtzioen gogorarazpena.' },
  },

  track: {
    project: 'Proiektua',
    projectName: 'Proiektuaren izena',
    projectNamePh: 'Nire bikeparka',
    newProject: 'Proiektu berria',
    deleteProject: 'Ezabatu proiektu hau',
    deleteConfirm: '«{name}» ezabatu? Ezin da desegin.',
    unnamed: 'Izenik gabe',
    importGpx: 'Inportatu GPX',
    draw: 'Marraztu pista bat',
    tracks: 'Pistak',
    fitProject: 'Zoom proiektu osora',
    empty: 'Ez da ibilbiderik kargatu.',
    labelPh: 'Etiketa',
    editTrack: 'Editatu ibilbidea mapan',
    fitTrack: 'Zoom pista honetara',
    hideTrack: 'Ezkutatu ibilbidea',
    showTrack: 'Erakutsi ibilbidea',
    showSettings: 'Erakutsi ezarpenak',
    hideSettings: 'Ezkutatu ezarpenak',
    deleteTrack: 'Ezabatu pista',
    typePista: 'Mota (Pista)',
    difficulty: 'Zailtasuna',
    color: 'Kolorea',
    width: 'Lodiera',
    style: 'Estiloa',
  },

  trailType: {
    enduro: 'Enduro',
    dh: 'Jaitsiera (DH)',
    uplift_lift: 'Igogailua (telesilla)',
    uplift_bike: 'Garraioa',
  },
  difficulty: { green: 'Berdea', blue: 'Urdina', red: 'Gorria', black: 'Beltza' },

  symbol: {
    selected: 'Hautatutako sinboloa',
    size: 'Tamaina',
    mirror: 'Ispilua',
    move: 'Mugitu',
    delete: 'Ezabatu',
    defaultLib: 'Sinbolo lehenetsiak',
    customLib: 'Nire sinboloak',
  },

  map: {
    relief: 'Erliebea',
    reliefDesc: 'Doitu lurraren intentsitatea 0 eta 5 artean.',
    intensity: 'Intentsitatea',
    shade: 'Itzaldura',
    shadeDesc: 'Doitu itzalduraren indarra % 0 eta % 100 artean.',
    font: 'Etiketen letra-tipoa',
    fontDesc: 'Letra-tipo bakarra pista izen guztietarako.',
    pistaTitle: 'Pista pistak',
    pistaDesc: 'Erakutsi Pistan jada argitaratutako pistak erreferentzia gisa.',
    showPista: 'Erakutsi lehendik dauden Pista pistak',
    heatmapTitle: 'Strava heatmap',
    heatmapDesc: 'Stravako bero-geruza (administrarientzat soilik).',
    showHeatmap: 'Erakutsi Stravako heatmap-a',
  },

  exportPanel: {
    title: 'Proiektua',
    desc: 'Zure proiektua automatikoki gordetzen da zure kontuan. Hemen: Pistara bidali edo esportatu.',
    pubTitle: 'Argitalpena',
    pubHintNew:
      'Marraztu pistak: zure spot-a automatikoki eta pribatuan sortzen da zure Pista eremuan (zuk soilik ikus dezakezu). Gero, eskatu argitalpena linean jartzeko.',
    requestPub: 'Eskatu argitalpena',
    pubHintDraft:
      'Zure spot-a pribatua da. Eskaerak Pista administrari bati bidaltzen dio, publiko egin aurretik berrikusiko duena.',
    pending: '⏳ Argitalpena eskatuta — administrariaren berrikuspenaren zain.',
    cancelRequest: 'Eskaera bertan behera utzi (editatzeko)',
    cancelHint: 'Zure bidalketa izoztuta dago berrikuspenean. Utzi editatzeko, gero berriro eskatu.',
    published: '✅ Pistan argitaratuta.',
    localTitle: 'Esportazio lokala',
    exportZip: 'Esportatu ZIP gisa',
    importZip: 'Inportatu ZIP bat',
    contribTitle: 'Proposatu lehendik dagoen spot bati',
    contribHint: 'Zure pistak Pistan jada argitaratutako spot bati proposatuko zaizkio (administrariaren berrikuspena).',
    contribSearch: 'Bilatu spot bat…',
    contribSend: 'Bidali {n} pista «{spot}»-(e)ra',
  },

  editor: {
    drawHint: '✏️ Sakatu mapan puntuak gehitzeko, sakatu bi aldiz pista amaitzeko.',
    editHint:
      '🔧 Arrastatu puntu bat mugitzeko · sakatu segmentu baten erdiko puntu argi bat gehitzeko · eskuin-klika puntu batean ezabatzeko.',
    finish: 'Amaitu',
  },

  reposition: {
    add: '📍 Sakatu mapan sinboloa gehitzeko',
    move: '📍 Sakatu mapan sinboloa mugitzeko',
  },

  toast: {
    private: 'Pistan pribatuan gordeta. Eskatu argitalpena prest zaudenean.',
    pendingUpdated: 'Bidalketa eguneratuta. Oraindik berrikuspenaren zain.',
    pubRequested: 'Argitalpena eskatuta — berrikuspenaren zain.',
    pubFail: 'Argitalpen eskaerak huts egin du.',
    cancelled: 'Eskaera bertan behera utzita — editatu eta berriro eskatu dezakezu.',
    cancelFail: 'Ezin izan da eskaera bertan behera utzi.',
    contribSent: '{n} pista proposatuta «{spot}»-(e)ra — berrikuspenaren zain.',
    contribFail: 'Ezin izan dira pistak bidali.',
  },

  help: {
    title: 'Laguntza eta tutoriala',
    desc: 'Bisita gidatua eta funtzioen gogorarazpena hasteko.',
    startTour: 'Hasi bisita gidatua',
    tip: '💡 Aholkua: eutsi eskuin-klikari mapan okertzeko eta 3D erliebeaz gozatzeko.',
    tracksTitle: 'Pistak',
    tracksDesc:
      'Inportatu zure GPXak edo marraztu pista bat eskuz, editatu puntuak (mugitu, gehitu, eskuin-klika = ezabatu), gero aldatu kolorea, lodiera, estiloa eta etiketak.',
    symbolsTitle: 'Sinboloak',
    symbolsDesc: 'Arrastatu sinboloak mapara, edo inportatu zure SVGak.',
    mapTitle: 'Mapa',
    mapDesc: 'Satelite/OSM oinarri-mapa, 3D erliebe eta itzaldura doigarriak.',
    exportTitle: 'Esportatu',
    exportDesc: 'Zure kontuan automatikoki gorde, ZIP esportatu/inportatu.',
  },

  locate: {
    title: 'Kokatu',
    desc: 'Bilatu helbide, herri edo leku bat (OpenStreetMap).',
    placeholder: 'adib.: Hossegor, edo helbide bat…',
    none: 'Emaitzarik ez.',
    unavailable: 'Bilaketa ez dago erabilgarri, saiatu berriro.',
  },
}
