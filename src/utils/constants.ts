import { Trophy, Users, MapPin, IndianRupee, Clock, RotateCcw, AlertTriangle, Scale, Gavel, Shirt } from 'lucide-react';

export const CLUBS = [
 { label: "Athletico Valaparamb", value: "athletico", logo: "/images/logos/athletico_logo.jpeg" },
  { label: "CFC Ambalathingal", value: "cfc_club", logo: "/images/logos/cfc_club.jpeg" },
  { label: "City Tigers VKM", value: "city_tigers", logo: "/images/logos/city_tigers_vkm.jpeg" },
  { label: "Amigoz Irumbuzhi", value: "amigoz_ibz", logo: "/images/logos/amigoz_irumbuzhi.jpeg" },
  { label: "HSP Town Team", value: "hsp_club", logo: "/images/logos/hsp_team.jpeg" },
  { label: "Town Team Irumbuzhi", value: "town_team", logo: "/images/logos/town_team_irumbuzhi.jpeg" },
  { label: "IFA Club", value: "ifa_club", logo: "/images/logos/ifa_academy.jpeg" },
  { label: "FC Karuvancheri", value: "karuvancheri", logo: "/images/logos/fc_karuvanchery.jpeg" },
  { label: "SIFA Sporting", value: "sifa_club", logo: "/images/logos/sifa_sporting.jpeg" },
  { label: "YSM Club", value: "ysm_fc", logo: "/images/logos/ysm_sporting.jpeg" },
  { label: "Gang On Fc", value: "gang_fc", logo: "/images/logos/gang_on_fc.jpeg" },
  { label: "YFC Irumbuzhi", value: "yfc_fc", logo: "/images/logos/default_logo.jpg" },
  { label: "Youth Wings VKM", value: "youthwings_fc", logo: "/images/logos/default_logo.jpg" },
  { label: "Symes Irumbuzhi", value: "symes_fc", logo: "/images/logos/default_logo.jpg" },
  { label: "Fc Parappuram", value: "parappuram_fc", logo: "/images/logos/default_logo.jpg" },
  { label: "YASCO Konikkal", value: "konikkal_fc", logo: "/images/logos/default_logo.jpg" },
  { label: "Al Madhaar Pallippadi", value: "madhaar_fc", logo: "/images/logos/default_logo.jpg" },
];

export const POSITIONS = [
  { label: 'Goalkeeper (GK)', value: 'GK', emoji: '🧤' },
  { label: 'Forward', value: 'FW', emoji: '⚽' },
  { label: 'Center Back (CB)', value: 'CB', emoji: '🛡️' }
];

export const MATCH_RULES = {
  en: [
    { icon: Trophy, text: "Tournament follows 5-a-side rules with local modifications." },
    { icon: Users, text: "Total registration is strictly limited to 48 players." },
    { icon: MapPin, text: "Participation is restricted to: Puliyengal, Irumbuzhi, HS Padi, Vadakkummuri, Konikkallu, Valaparamb, Mannampara, and Karuvancheriparamb." },
    { icon: IndianRupee, text: "The player registration fee is ₹150." },
    { icon: RotateCcw, text: "Rolling substitution is allowed." },
    { icon: AlertTriangle, text: "Upon registration, status is 'Pending'. It will be approved by the admin after fee payment." }
  ],
  ml: [
    { icon: Trophy, text: "ടൂർണമെന്റ് 5-എ-സൈഡ് നിയമങ്ങൾ അടിസ്ഥാനമാക്കിയാണ് നടക്കുന്നത്." },
    { icon: Users, text: "രജിസ്ട്രേഷൻ 48 കളിക്കാർക്ക് മാത്രമായി കർശനമായി പരിമിതപ്പെടുത്തിയിരിക്കുന്നു." },
    { icon: MapPin, text: "Puliyengal, Irumbuzhi, High school padi, Vadakkummuri, Konikkallu, Valaparambu, Mannampara, Karuvancheri parambu എന്നിവടങ്ങളിൽ ഉള്ളവർക്ക് മാത്രം." },
    { icon: IndianRupee, text: "കളിക്കാരുടെ രജിസ്ട്രേഷൻ ഫീസ് 150 രൂപയാണ്." },
    { icon: RotateCcw, text: "റോളിംഗ് സബ്സ്റ്റിറ്റ്യൂഷൻ അനുവദനീയമാണ്." },
    { icon: AlertTriangle, text: "രജിസ്റ്റർ ചെയ്യുമ്പോൾ സ്റ്റാറ്റസ് 'Pending' ആയിരിക്കും. ഫീസ് അടച്ചതിന് ശേഷം മാത്രമേ അഡ്മിൻ അംഗീകരിക്കുകയുള്ളൂ." }
  ]
};

export const PLAYING_RULES = {
  en: [
    { icon: Clock, text: "Players must report to the ground at least 20 minutes before kick-off." },
    { icon: Scale, text: "The referee's decision on the field will be final and binding." },
    { icon: Users, text: "Each team is allowed a maximum of 2 substitutes." },
    { icon: Gavel, text: "All players will be drafted via auction. There is no 'unsold' category." },
    { icon: Shirt, text: "Wearing a proper football kit is mandatory for all participants." }
  ],
  ml: [
    { icon: Clock, text: "കളിക്കാർ മത്സരത്തിന് 20 മിനിറ്റ് മുമ്പെങ്കിലും ഗ്രൗണ്ടിൽ എത്തിച്ചേരേണ്ടതാണ്." },
    { icon: Scale, text: "കളിക്കളത്തിൽ റഫറിയുടെ തീരുമാനം അന്തിമമായിരിക്കും." },
    { icon: Users, text: "ഓരോ ടീമിനും പരമാവധി 2 പകരക്കാരെ ഉൾപ്പെടുത്താം." },
    { icon: Gavel, text: "എല്ലാ കളിക്കാരെയും ലേലത്തിലൂടെ ടീമുകളിലേക്ക് തിരഞ്ഞെടുക്കും. No unsold option" },
    { icon: Shirt, text: "ശരിയായ ഫുട്ബോൾ കിറ്റ് നിർബന്ധമായും ധരിക്കേണ്ടതാണ്." }
  ]
};