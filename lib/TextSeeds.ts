export type SeedKey
  = | 'morse'
    | 'morseWithEs'
    | 'k1'
    | 'k2'
    | 'k3'
    | 'k4Conventional'
    | 'k4DSTheory'
    | 'k1Plain'
    | 'k2Plain'
    | 'k3Plain'

export const MORSE_WITHOUT_E = [
  'VIRTUALLY',
  'INVISIBLE',
  'SHADOW',
  'FORCES',
  'LUCID',
  'MEMORY',
  'RQ',
  'SOS',
  'DIGETAL',
  'INTERPRETATIU',
  'TISYOUR',
  'POSITION',
].join('\n')

export const MORSE_WITH_E = [
  'EEVIRTUALLYE',
  'EEEEEEINVISIBLE',
  'EESHADOWEE',
  'FORCESEEEEE',
  'LUCIDEEE',
  'MEMORYE',
  'RQ',
  'SOS',
  'EDIGETALEEE',
  'INTERPRETATIO',
  'TISYOUR',
  'POSITIONE',
].join('\n')

export const K1_PLAIN = 'BETWEENSUBTLESHADINGANDTHEABSENCEOFLIGHTLIESTHENUANCEOFIQLUSION'
export const K2_PLAIN = 'ITWASTOTALLYINVISIBLEHOWSTHATPOSSIBLETHEYUSEDTHEEARTHSMAGNETICFIELDXTHEINFORMATIONWASGATHEREDANDTRANSMITTEDUNDERGROUNDTOANUNKNOWNLOCATIONXDOESLANGLEYKNOWABOUTTHISTHEYSHOULDITSBURIEDOUTTHERESOMEWHEREXWHOKNOWSTHEEXACTLOCATIONONLYWWTHISWASHISLASTMESSAGEXTHIRTYEIGHTDEGREESFIFTYSEVENMINUTESSIXPOINTFIVESECONDSNORTHSEVENTYSEVENDEGREESEIGHTMINUTESFORTYFOURSECONDSWEST'
export const K3_PLAIN = 'LAYERTWOSLOWLYDESPARATLYSLOWLYTHEREMAINSOFPASSAGEDEBRISTHATENCUMBEREDTHELOWERPARTOFTHEDOORWAYWASREMOVEDWITHTREMBLINGHANDSIMADEATINYBREACHINTHEUPPERLEFTHANDCORNERANDTHENWIDENINGTHEHOLEALITTILEIINSERTEDTHECANDLEANDPEEREDINTOTHEHOTAIRESCAPINGFROMTHECHAMBERCAUSEDTHEFLAMETOFLICKERBUTPRESENTLYDETAILSOFTHEROOMWITHINEMERGEDFROMTHEMISTXCANYOUSEEANYTHINGQ'

export const K1_CIPHER = '' // paste your section ciphertext if you want
export const K2_CIPHER = '' // (left empty by default)
export const K3_CIPHER = ''

export const K4_CONVENTIONAL = 'BERLINCLOCK'
export const K4_DS = '' // fill with your DS working string if you like

export const textSeeds = {
  morse: MORSE_WITHOUT_E,
  morseWithEs: MORSE_WITH_E,
  k1: K1_CIPHER,
  k2: K2_CIPHER,
  k3: K3_CIPHER,
  k4Conventional: K4_CONVENTIONAL,
  k4DSTheory: K4_DS,
  k1Plain: K1_PLAIN,
  k2Plain: K2_PLAIN,
  k3Plain: K3_PLAIN,
} as const

export const seedOptions = [
  { key: 'morse', label: 'Morse Code' },
  { key: 'morseWithEs', label: 'Morse Code with EEs' },
  { key: 'k1', label: 'K1' },
  { key: 'k2', label: 'K2' },
  { key: 'k3', label: 'K3' },
  { key: 'k4Conventional', label: 'K4 (conventional wisdom)' },
  { key: 'k4DSTheory', label: 'K4 (DS Theory)' },
  { key: 'k1Plain', label: 'K1 Plaintext' },
  { key: 'k2Plain', label: 'K2 Plaintext' },
  { key: 'k3Plain', label: 'K3 Plaintext' },
]
