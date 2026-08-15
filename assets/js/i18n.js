/* ============================================================
   Bilingual strings — Hindi / English (rule 16).
   Convention on screen: chosen language is primary, the other is
   shown beneath in smaller type (standard Indian transit practice).
   %s placeholders are filled by kiosk.js.
   ============================================================ */

const STR = {
  /* brand */
  'brand':          { en: 'Varanasi Ropeway',                    hi: 'वाराणसी रोपवे' },
  'brand.machine':  { en: 'Ticket Vending Machine',              hi: 'टिकट वेंडिंग मशीन' },
  'brand.tag':      { en: 'Spiritual Journey, Elevated.',        hi: 'आध्यात्मिक यात्रा, नई ऊँचाई पर' },

  /* attract */
  'touch':          { en: 'Touch the screen to begin',           hi: 'शुरू करने के लिए स्क्रीन स्पर्श करें' },
  'strip.fares':    { en: 'Tickets from <b>₹%s</b>',             hi: 'टिकट <b>₹%s</b> से' },
  'strip.upi':      { en: '<b>UPI</b> payment only',             hi: 'केवल <b>UPI</b> भुगतान' },
  'strip.hours':    { en: 'First cabin <b>05:00</b> · Last cabin <b>21:00</b>', hi: 'पहला केबिन <b>05:00</b> · अंतिम केबिन <b>21:00</b>' },

  /* language screen */

  /* menu */
  'menu.greet':     { en: 'Namaste!',                            hi: 'नमस्ते!' },
  'menu.q':         { en: 'What would you like to do?',          hi: 'आप क्या करना चाहेंगे?' },
  'tile.buy':       { en: 'Buy Ticket',                          hi: 'टिकट खरीदें' },
  'tile.buy.sub':   { en: 'Single or return journey — pay by UPI', hi: 'एकल या वापसी यात्रा — UPI से भुगतान' },
  'tile.balance':   { en: 'Check Card Balance',                  hi: 'कार्ड बैलेंस देखें' },
  'tile.balance.sub':{ en: 'NCMC transit card',                  hi: 'NCMC ट्रांज़िट कार्ड' },
  'tile.recharge':  { en: 'Recharge Card',                       hi: 'कार्ड रिचार्ज करें' },
  'tile.recharge.sub':{ en: 'Recharge your NCMC card by UPI',    hi: 'UPI से अपना NCMC कार्ड रिचार्ज करें' },
  'menu.upionly':   { en: 'This machine accepts UPI only — no cash. For cash or debit/credit card payment please use the ticket counter.',
                      hi: 'यह मशीन केवल UPI स्वीकार करती है — नकद नहीं। नकद या डेबिट/क्रेडिट कार्ड भुगतान के लिए कृपया टिकट काउंटर का उपयोग करें।' },
  'menu.hours':     { en: 'Service today 05:00 – 21:00',         hi: 'आज सेवा 05:00 – 21:00' },

  /* steps */
  'step.ticket':    { en: 'Ticket',                              hi: 'टिकट' },
  'step.station':   { en: 'Station',                             hi: 'स्टेशन' },
  'step.pax':       { en: 'Passengers',                          hi: 'यात्री' },
  'step.pay':       { en: 'Payment',                             hi: 'भुगतान' },

  /* product */
  'prod.q':         { en: 'Which ticket would you like?',        hi: 'कौन-सा टिकट चाहिए?' },
  'sjt':            { en: 'Single Journey',                      hi: 'एकल यात्रा' },
  'sjt.desc':       { en: 'One-way journey. Exit at any station up to your destination. Valid today only.',
                      hi: 'एक तरफ़ की यात्रा। गंतव्य तक किसी भी स्टेशन पर उतर सकते हैं। केवल आज मान्य।' },
  'rjt':            { en: 'Return Journey',                      hi: 'वापसी यात्रा' },
  'rjt.desc':       { en: 'Out and back on the same day. Printed as 2 tickets per passenger — outward and return.',
                      hi: 'एक ही दिन जाना और वापसी। प्रति यात्री 2 टिकट प्रिंट होते हैं — जाने और वापसी के।' },
  'from':           { en: 'from',                                hi: 'से शुरू' },
  'popular':        { en: 'Most popular',                        hi: 'सबसे लोकप्रिय' },
  'rjt.chip':       { en: '2 tickets per passenger',             hi: '2 टिकट प्रति यात्री' },
  'sjt.chip':       { en: '1 ticket per passenger',              hi: 'प्रति यात्री 1 टिकट' },
  'a11y.fewer':     { en: 'Fewer passengers',                    hi: 'यात्री घटाएँ' },
  'a11y.more':      { en: 'More passengers',                     hi: 'यात्री बढ़ाएँ' },

  /* destination */
  'dest.q':         { en: 'Where are you travelling to?',        hi: 'आप कहाँ जाना चाहते हैं?' },
  'dest.hint':      { en: 'Your journey starts here at %s.',     hi: 'आपकी यात्रा यहाँ %s से शुरू होती है।' },
  'youarehere':     { en: 'You are here',                        hi: 'आप यहाँ हैं' },
  'hops.1':         { en: 'Next station',                        hi: 'अगला स्टेशन' },
  'hops.n':         { en: '%s stations away',                    hi: '%s स्टेशन दूर' },
  'dfare.sjt':      { en: 'single',                              hi: 'एकल' },
  'dfare.rjt':      { en: 'return',                              hi: 'वापसी' },

  /* passengers */
  'pax.q':          { en: 'How many passengers?',                hi: 'कितने यात्री?' },
  'pax.note':       { en: 'Up to %s passengers in one payment. Each passenger receives their own ticket.',
                      hi: 'एक भुगतान में अधिकतम %s यात्री। प्रत्येक यात्री को अपना टिकट मिलता है।' },
  'pax.note.rjt':   { en: 'Return journey: each passenger receives 2 tickets — outward and return.',
                      hi: 'वापसी यात्रा: प्रत्येक यात्री को 2 टिकट मिलते हैं — जाने और वापसी के।' },
  'perticket':      { en: 'per ticket',                          hi: 'प्रति टिकट' },

  /* summary */
  'sum.q':          { en: 'Please review your order',            hi: 'कृपया अपना विवरण जाँचें' },
  'row.ticket':     { en: 'Ticket',                              hi: 'टिकट' },
  'row.journey':    { en: 'Journey',                             hi: 'यात्रा' },
  'row.pax':        { en: 'Passengers',                          hi: 'यात्री' },
  'row.fare':       { en: 'Fare per passenger',                  hi: 'किराया प्रति यात्री' },
  'row.tickets':    { en: 'Tickets to print',                    hi: 'प्रिंट होने वाले टिकट' },
  'total':          { en: 'Total',                               hi: 'कुल राशि' },
  'gst.line':       { en: 'Includes GST (%s%%) of ₹%s',          hi: 'कुल में GST (%s%%) ₹%s शामिल' },
  'sum.terms':      { en: 'Tickets are valid today only. No refund is provided except when the service is disrupted.',
                      hi: 'टिकट केवल आज के लिए मान्य हैं। सेवा बाधित होने के अलावा कोई धनवापसी नहीं होती।' },
  'pay.upi':        { en: 'Pay ₹%s by UPI',                      hi: 'UPI से ₹%s का भुगतान करें' },

  /* upi */
  'upi.q':          { en: 'Scan to pay',                         hi: 'स्कैन करें और भुगतान करें' },
  'upi.topup.q':    { en: 'Scan to pay for recharge',            hi: 'रिचार्ज के लिए स्कैन कर भुगतान करें' },
  'upi.any':        { en: 'Works with any UPI app',              hi: 'किसी भी UPI ऐप से काम करता है' },
  'upi.s1':         { en: 'Open your UPI app',                   hi: 'अपना UPI ऐप खोलें' },
  'upi.s2':         { en: 'Scan this QR code',                   hi: 'यह QR कोड स्कैन करें' },
  'upi.s3':         { en: 'Confirm the payment',                 hi: 'भुगतान की पुष्टि करें' },
  'timeleft':       { en: 'Time remaining',                      hi: 'शेष समय' },
  'ref':            { en: 'Reference',                           hi: 'संदर्भ संख्या' },

  /* printing */
  'paid':           { en: 'Payment received',                    hi: 'भुगतान प्राप्त हुआ' },
  'print.n':        { en: 'Printing ticket %s of %s',            hi: 'टिकट %s / %s प्रिंट हो रहा है' },
  'print.wait':     { en: 'Please wait — do not leave the machine', hi: 'कृपया प्रतीक्षा करें — मशीन से दूर न जाएँ' },

  /* success */
  'done.q':         { en: 'Collect your tickets',                hi: 'अपने टिकट लें' },
  'done.sub':       { en: 'from the slot below',                 hi: 'नीचे दिए गए स्लॉट से' },
  'chip.tickets':   { en: '%s tickets printed',                  hi: '%s टिकट प्रिंट हुए' },
  'chip.ticket1':   { en: '1 ticket printed',                    hi: '1 टिकट प्रिंट हुआ' },
  'remind.today':   { en: 'Valid today only',                    hi: 'टिकट केवल आज मान्य है' },
  'remind.exit':    { en: 'You may exit at any station up to your destination',
                      hi: 'गंतव्य तक किसी भी स्टेशन पर उतर सकते हैं' },
  'remind.keep':    { en: 'Keep your ticket until you exit',     hi: 'बाहर निकलने तक टिकट संभालकर रखें' },
  'returning':      { en: 'Returning to start in %s s',          hi: '%s सेकंड में मुख्य स्क्रीन पर वापसी' },
  'done':           { en: 'Done',                                hi: 'हो गया' },

  /* payment timeout */
  'pt.q':           { en: "We didn't receive the payment",       hi: 'भुगतान प्राप्त नहीं हुआ' },
  'pt.body':        { en: 'No ticket was issued. If the payment completed after time ran out, please collect your ticket at the counter with the reference below.',
                      hi: 'कोई टिकट जारी नहीं हुआ। यदि समय समाप्त होने के बाद भुगतान हुआ है, तो नीचे दिए संदर्भ के साथ काउंटर से टिकट प्राप्त करें।' },
  'retry':          { en: 'Try again',                           hi: 'फिर से प्रयास करें' },
  'startover':      { en: 'Start over',                          hi: 'फिर से शुरू करें' },

  /* print fail */
  'pf.q':           { en: 'Payment received, but tickets could not print',
                      hi: 'भुगतान प्राप्त हुआ, पर टिकट प्रिंट नहीं हो सके' },
  'pf.body':        { en: 'Please go to the ticket counter with this reference number. Staff have already been alerted.',
                      hi: 'कृपया इस संदर्भ संख्या के साथ टिकट काउंटर पर जाएँ। कर्मचारियों को सूचित कर दिया गया है।' },

  /* NCMC */
  'tap.q':          { en: 'Place your card on the reader',       hi: 'कार्ड को रीडर पर रखें' },
  'tap.hint':       { en: 'Hold your NCMC card flat on the glowing reader below the screen.',
                      hi: 'अपना NCMC कार्ड स्क्रीन के नीचे चमकते रीडर पर सीधा रखें।' },
  'ctx.balance':    { en: 'Balance enquiry',                     hi: 'बैलेंस जाँच' },
  'ctx.topup':      { en: 'Card recharge',                       hi: 'कार्ड रिचार्ज' },
  'bal.q':          { en: 'Card balance',                        hi: 'कार्ड बैलेंस' },
  'bal.lbl':        { en: 'Available balance',                   hi: 'उपलब्ध बैलेंस' },
  'bal.card':       { en: 'NCMC · valid till 03/2029',           hi: 'NCMC · 03/2029 तक वैध' },
  'bal.recharge':   { en: 'Recharge this card',                  hi: 'यह कार्ड रिचार्ज करें' },
  'amt.q':          { en: 'Choose recharge amount',              hi: 'रिचार्ज राशि चुनें' },
  'ts.q':           { en: 'Recharge successful',                 hi: 'रिचार्ज सफल हुआ' },
  'ts.body':        { en: '₹%s has been added to your card. Your receipt is printing below.',
                      hi: 'आपके कार्ड में ₹%s जोड़ दिए गए हैं। आपकी रसीद नीचे प्रिंट हो रही है।' },
  'ts.newbal':      { en: 'New balance',                         hi: 'नया बैलेंस' },
  'cb.q':           { en: 'This card cannot be used here',       hi: 'यह कार्ड यहाँ उपयोग नहीं किया जा सकता' },
  'cb.body':        { en: 'Please contact the ticket counter for assistance.',
                      hi: 'कृपया सहायता के लिए टिकट काउंटर से संपर्क करें।' },

  /* idle modal */
  'idle.q':         { en: 'Are you still there?',                hi: 'क्या आप अभी भी यहाँ हैं?' },
  'idle.body':      { en: 'This session will end and your selections will be cleared.',
                      hi: 'यह सत्र समाप्त हो जाएगा और आपके चयन हट जाएँगे।' },
  'idle.yes':       { en: 'Yes, continue',                       hi: 'हाँ, जारी रखें' },

  /* out of service / offline */
  'helpline':       { en: 'Helpline',                            hi: 'हेल्पलाइन' },

  /* help screen */
  'help.t':         { en: 'Help & Support',                      hi: 'सहायता' },
  'help.how':       { en: 'How to buy a ticket',                 hi: 'टिकट कैसे खरीदें' },
  'help.s1':        { en: 'Choose your ticket and destination station',
                      hi: 'अपना टिकट और गंतव्य स्टेशन चुनें' },
  'help.s2':        { en: 'Pay by scanning the QR with any UPI app',
                      hi: 'किसी भी UPI ऐप से QR स्कैन कर भुगतान करें' },
  'help.s3':        { en: 'Collect your tickets and scan them at the gate',
                      hi: 'टिकट लें और गेट पर स्कैन करें' },
  'help.facts':     { en: 'About this machine',                  hi: 'इस मशीन के बारे में' },
  'fact.upi':       { en: 'UPI payment only — no cash is held here',
                      hi: 'केवल UPI भुगतान — यहाँ नकद नहीं रखा जाता' },
  'fact.reprint':   { en: 'Tickets cannot be reprinted — keep them safe',
                      hi: 'टिकट दोबारा प्रिंट नहीं होते — संभालकर रखें' },
  'fact.group':     { en: 'Up to %s tickets in one payment',     hi: 'एक भुगतान में अधिकतम %s टिकट' },
  'fact.ncmc':      { en: 'NCMC card holders can go directly to the gate',
                      hi: 'NCMC कार्ड धारक सीधे गेट पर जा सकते हैं' },
  'help.staff':     { en: 'For cash payment or any assistance, staff are available at the ticket counter.',
                      hi: 'नकद भुगतान या किसी सहायता के लिए टिकट काउंटर पर कर्मचारी उपलब्ध हैं।' },

  /* chrome */
  'back':           { en: 'Back',                                hi: 'वापस' },
  'cancel':         { en: 'Cancel',                              hi: 'रद्द करें' },
  'continue':       { en: 'Continue',                            hi: 'आगे बढ़ें' },
  'help.f':         { en: 'Help',                                hi: 'सहायता' },
  'upionly.chip':   { en: 'UPI only',                            hi: 'केवल UPI' },
};

/* stations — codes from the project seed */
const STATIONS = [
  { code: 'VCT', en: 'Varanasi Cantt',  hi: 'वाराणसी कैंट' },
  { code: 'VDP', en: 'Vidyapith',       hi: 'विद्यापीठ' },
  { code: 'RYT', en: 'Rath Yatra',      hi: 'रथयात्रा' },
  { code: 'GDC', en: 'Gadoliya Chowk',  hi: 'गदौलिया चौक' },
];

/* PLACEHOLDER fares (₹, GST-inclusive) pending the approved fare
   schedule — station-pair based, from this kiosk's station VCT.
   RJT = 2 × SJT until the fare policy says otherwise. */
const FARES = { VDP: 60, RYT: 90, GDC: 120 };
const GST_RATE = 0.05;          /* open point 15 — configurable */
const MAX_GROUP = 6;            /* open point 5  — configurable */
const KIOSK = { station: 'VCT', device: 'VCT-TVM-02' };

function t(key, lang) {
  const e = STR[key];
  if (!e) { console.warn('i18n miss:', key); return key; }
  return e[lang] ?? e.en;
}
/* fill %s placeholders left-to-right; %% → % */
function tf(key, lang, ...args) {
  let s = t(key, lang), i = 0;
  return s.replace(/%%|%s/g, m => (m === '%%' ? '%' : String(args[i++] ?? '')));
}
function otherLang(l) { return l === 'hi' ? 'en' : 'hi'; }
