import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  addDays,
  addMinutes,
  setHours,
  setMinutes,
  startOfDay,
  subDays,
} from "date-fns";
import {
  AppointmentStatus,
  ConsultationType,
  PrismaClient,
  Role,
  WaitingStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_MARKER = "DEMO_SEED_V2";

async function writeDemoFile(relPath: string, content: string) {
  const full = path.join(process.cwd(), relPath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content, "utf8");
}

async function main() {
  const doctorHash = await bcrypt.hash("Admin123!", 12);
  const secHash = await bcrypt.hash("Secret123!", 12);

  await prisma.user.upsert({
    where: { email: "medecin@cabinet.local" },
    update: {},
    create: {
      email: "medecin@cabinet.local",
      passwordHash: doctorHash,
      name: "Dr. Fatima Benali",
      role: Role.DOCTOR,
      active: true,
      permRdv: true,
      permFile: true,
      permPaie: true,
      permPatAdm: true,
      permPatConst: true,
      permPatMed: true,
      permStats: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "secretaire@cabinet.local" },
    update: {},
    create: {
      email: "secretaire@cabinet.local",
      passwordHash: secHash,
      name: "Nadia El Mansouri",
      role: Role.SECRETARY,
      active: true,
      permRdv: true,
      permFile: true,
      permPaie: true,
      permPatAdm: true,
      permPatConst: false,
      permPatMed: false,
      permStats: true,
    },
  });

  const tarifs = [
    { label: "Consultation", amount: 60 },
    { label: "Contrôle", amount: 45 },
    { label: "Première consultation", amount: 80 },
  ];
  for (const t of tarifs) {
    const existing = await prisma.tarif.findFirst({ where: { label: t.label } });
    if (!existing) await prisma.tarif.create({ data: t });
  }

  const doctor = await prisma.user.findUniqueOrThrow({
    where: { email: "medecin@cabinet.local" },
  });

  /* Réinitialiser les données de démo (patients et tout ce qui dépend) */
  await prisma.patient.deleteMany({});
  await prisma.auditLog.deleteMany({});

  const today = startOfDay(new Date());

  type PSeed = {
    lastName: string;
    firstName: string;
    birth: string;
    sex: string;
    coverage: string;
    phone: string;
    cin?: string;
    address?: string;
    bp?: string;
    weight?: string;
    height?: string;
    pulse?: string;
    antecedents?: string;
    diagnostics?: string;
    docs?: { type: string; title: string; daysAgo: number }[];
  };

  const roster: PSeed[] = [
    {
      lastName: "Alami",
      firstName: "Youssef",
      birth: "1982-03-14",
      sex: "M",
      coverage: "Régime général + mutuelle",
      phone: "0612345678",
      address: "12 rue Ibn Batouta, Rabat",
      bp: "128/82",
      weight: "78 kg",
      height: "178 cm",
      pulse: "72",
      antecedents: "Migraine depuis l’adolescence. Pas d’allergie médicamenteuse connue.",
      diagnostics: "Céphalées de type tensionnel. Bilan IRM cérébral normal (voir document).",
      docs: [
        { type: "IRM", title: "IRM encéphale sans injection", daysAgo: 40 },
        { type: "EEG", title: "EEG de veille", daysAgo: 12 },
      ],
    },
    {
      lastName: "Bennani",
      firstName: "Salma",
      birth: "1995-11-02",
      sex: "F",
      coverage: "AMO + CMU complémentaire",
      phone: "0667788990",
      bp: "110/70",
      weight: "62 kg",
      height: "165 cm",
      pulse: "68",
      antecedents: "Épisode unique de vertiges rotatoires (2024).",
      diagnostics: "Vertige positionnel paroxystique probable — manœuvre de Semont envisagée.",
      docs: [{ type: "ENMG", title: "ENMG membres sup.", daysAgo: 5 }],
    },
    {
      lastName: "Cherkaoui",
      firstName: "Mehdi",
      birth: "1970-07-22",
      sex: "M",
      coverage: "Régime général",
      phone: "0522123456",
      cin: "AB123456",
      bp: "135/88",
      weight: "92 kg",
      height: "174 cm",
      pulse: "76",
      antecedents: "HTA traitée (IEC). Tabagisme sevré.",
      diagnostics: "Neuropathie sensitive distale légère — suivi glycémique à renforcer.",
      docs: [
        { type: "Scanner", title: "Scanner thoraco-abdominal", daysAgo: 90 },
        { type: "PEV", title: "PEV voies visuelles", daysAgo: 20 },
      ],
    },
    {
      lastName: "Daoudi",
      firstName: "Imane",
      birth: "2001-01-30",
      sex: "F",
      coverage: "Étudiante — assurance universitaire",
      phone: "0699887766",
      bp: "118/75",
      weight: "55 kg",
      height: "168 cm",
      pulse: "82",
      antecedents: "Anxiété documentée. Pas de traitement neuroleptique.",
      diagnostics: "Céphalées chroniques quotidiennes — hygiène de vie et suivi.",
    },
    {
      lastName: "El Fassi",
      firstName: "Omar",
      birth: "1965-12-05",
      sex: "M",
      coverage: "Régime agricole",
      phone: "0677112233",
      bp: "142/92",
      weight: "88 kg",
      height: "172 cm",
      pulse: "70",
      antecedents: "Diabète type 2. Insuffisance rénale légère (DFG limite).",
      diagnostics: "Tremblement d’action léger — observation, pas de L-dopa à ce stade.",
      docs: [{ type: "IRM", title: "IRM tronc cérébral", daysAgo: 60 }],
    },
    {
      lastName: "Filali",
      firstName: "Houda",
      birth: "1988-09-18",
      sex: "F",
      coverage: "Mutuelle entreprise",
      phone: "0611223344",
      bp: "122/78",
      weight: "70 kg",
      height: "170 cm",
      pulse: "74",
      antecedents: "Grossesse 2023 sans complication.",
      diagnostics: "Paresthésies des membres supérieurs — probable canal carpien bilatéral léger.",
    },
    {
      lastName: "Ghazi",
      firstName: "Karim",
      birth: "1992-04-25",
      sex: "M",
      coverage: "Régime général",
      phone: "0655443322",
      bp: "120/80",
      weight: "75 kg",
      height: "181 cm",
      pulse: "66",
      antecedents: "Traumatisme crânien léger (sport) en 2022.",
      diagnostics: "Céphalées post-commotionnelles résiduelles — amélioration progressive.",
      docs: [{ type: "EEG", title: "EEG prolongé sommeil", daysAgo: 8 }],
    },
    {
      lastName: "Hakimi",
      firstName: "Leïla",
      birth: "1978-08-09",
      sex: "F",
      coverage: "AME",
      phone: "0666554433",
      bp: "105/68",
      weight: "58 kg",
      height: "160 cm",
      pulse: "88",
      antecedents: "Asthme léger.",
      diagnostics: "Crises épileptiques focales traitées — bon contrôle sous AED.",
    },
    {
      lastName: "Idrissi",
      firstName: "Amine",
      birth: "2005-06-12",
      sex: "M",
      coverage: "Parents — assurance famille",
      phone: "0677889900",
      bp: "112/70",
      weight: "68 kg",
      height: "175 cm",
      pulse: "78",
      antecedents: "Négatif.",
      diagnostics: "Syncopes vagales à l’effort scolaire — réassurance + hydratation.",
    },
    {
      lastName: "Jabri",
      firstName: "Rachida",
      birth: "1958-02-28",
      sex: "F",
      coverage: "Retraitée — AMO",
      phone: "0522987654",
      bp: "130/85",
      weight: "72 kg",
      height: "158 cm",
      pulse: "65",
      antecedents: "FA paroxystique. AVK puis AOD.",
      diagnostics: "TIA amaurose fugace — bilan carotidien rassurant.",
      docs: [{ type: "Scanner", title: "Scanner cérébral urgent", daysAgo: 3 }],
    },
    {
      lastName: "Kettani",
      firstName: "Samir",
      birth: "1985-10-10",
      sex: "M",
      coverage: "Régime général",
      phone: "0610101010",
      bp: "118/76",
      weight: "80 kg",
      height: "176 cm",
      pulse: "72",
      antecedents: "Apnées du sommeil non traitées.",
      diagnostics: "Hypersomnolence diurne — orientation polygraphie.",
    },
    {
      lastName: "Lahlou",
      firstName: "Meryem",
      birth: "1990-05-17",
      sex: "F",
      coverage: "Mutuelle",
      phone: "0666123456",
      bp: "124/80",
      weight: "64 kg",
      height: "163 cm",
      pulse: "70",
      antecedents: "Dépression en rémission.",
      diagnostics: "Neuropathie fibromyalgique — prise en charge multidisciplinaire.",
    },
    {
      lastName: "Mouline",
      firstName: "Hassan",
      birth: "1962-11-30",
      sex: "M",
      coverage: "Régime général",
      phone: "0677001122",
      bp: "138/90",
      weight: "95 kg",
      height: "169 cm",
      pulse: "74",
      antecedents: "Hypercholestérolémie.",
      diagnostics: "Parkinson précoce discuté — suivi clinique 6 mois.",
      docs: [
        { type: "IRM", title: "IRM substantia nigra", daysAgo: 15 },
        { type: "Autre", title: "Compte rendu neuropsychologique", daysAgo: 10 },
      ],
    },
    {
      lastName: "Nasr",
      firstName: "Zineb",
      birth: "1999-07-07",
      sex: "F",
      coverage: "Régime général",
      phone: "0699112233",
      bp: "116/74",
      weight: "59 kg",
      height: "166 cm",
      pulse: "80",
      antecedents: "Céphalées menstruelles.",
      diagnostics: "Migraine sans aura — traitement de crise adapté.",
    },
  ];

  const createdIds: string[] = [];

  for (const p of roster) {
    const patient = await prisma.patient.create({
      data: {
        lastName: p.lastName,
        firstName: p.firstName,
        birthDate: new Date(p.birth),
        sex: p.sex,
        coverageType: p.coverage,
        phone: p.phone,
        cin: p.cin ?? null,
        address: p.address ?? null,
        medical: {
          create: {
            bloodPressure: p.bp ?? null,
            weight: p.weight ?? null,
            height: p.height ?? null,
            pulse: p.pulse ?? null,
            antecedents: p.antecedents ?? null,
            diagnostics: `${p.diagnostics ?? ""}\n[${DEMO_MARKER}]`,
          },
        },
      },
      include: { medical: true },
    });
    createdIds.push(patient.id);

    if (p.docs && patient.medical) {
      for (const d of p.docs) {
        const safe = `demo_${patient.id.slice(0, 8)}_${d.type}_${d.daysAgo}.txt`;
        const rel = path.join("storage", "uploads", safe).replace(/\\/g, "/");
        await writeDemoFile(
          rel,
          `Document fictif (${d.type}) — ${d.title}\nPatient: ${p.lastName} ${p.firstName}\n${DEMO_MARKER}\n`
        );
        await prisma.medicalDocument.create({
          data: {
            medicalId: patient.medical.id,
            docType: d.type,
            title: d.title,
            examDate: subDays(today, d.daysAgo),
            fileName: safe,
            filePath: rel,
          },
        });
      }
    }
  }

  /* Consultations passées */
  const consultNotes = [
    "Examen neurologique normal. Pas de déficit moteur.",
    "Force 5/5 aux 4 membres. ROT vifs symétriques.",
    "Marche tandem correcte. Pas de signe cérébelleux.",
    "Hypoesthésie D1-D3 discutée — à surveiller.",
  ];

  for (let i = 0; i < createdIds.length; i++) {
    const pid = createdIds[i]!;
    const nPast = 1 + (i % 3);
    for (let k = 0; k < nPast; k++) {
      const dayOff = 5 + k * 14 + (i % 5);
      await prisma.consultation.create({
        data: {
          patientId: pid,
          doctorId: doctor.id,
          date: subDays(today, dayOff),
          type: k === 0 ? ConsultationType.FIRST : ConsultationType.CONTROL,
          notes: consultNotes[(i + k) % consultNotes.length],
        },
      });
    }
  }

  /* Rendézvous : créneaux espacés (pas de chevauchement), passés + futurs */
  const apptMotifs = [
    "Contrôle EEG",
    "Bilan céphalées",
    "1ère consultation neuropathie",
    "Suivi parkinsonien",
    "Vertiges",
    "Résultats IRM",
    "Renouvellement ordonnance",
    "Bilan mémoire",
  ];

  const t0 = setMinutes(setHours(subDays(today, 1), 8), 0);
  const now = new Date();
  for (let n = 0; n < 40; n++) {
    const start = addMinutes(t0, n * 25);
    const end = addMinutes(start, 30);
    const pid = createdIds[n % createdIds.length]!;
    let status: AppointmentStatus = AppointmentStatus.SCHEDULED;
    if (end < now) {
      status = n % 11 === 0 ? AppointmentStatus.NO_SHOW : AppointmentStatus.DONE;
    }
    await prisma.appointment.create({
      data: {
        patientId: pid,
        start,
        end,
        type: n % 4 === 0 ? ConsultationType.FIRST : ConsultationType.CONTROL,
        motif: apptMotifs[n % apptMotifs.length]!,
        status,
      },
    });
  }

  /* Quelques RDV supplémentaires dans le futur lointain */
  for (let j = 0; j < 8; j++) {
    const day = addDays(today, 10);
    const start = addMinutes(setHours(day, 9), j * 35);
    const end = addMinutes(start, 30);
    await prisma.appointment.create({
      data: {
        patientId: createdIds[j % createdIds.length]!,
        start,
        end,
        type: ConsultationType.CONTROL,
        motif: `Suivi programmé (${j + 1})`,
        status: AppointmentStatus.SCHEDULED,
      },
    });
  }

  /* File d’attente aujourd’hui */
  const queueIdx = [0, 1, 2, 4, 6];
  for (let q = 0; q < queueIdx.length; q++) {
    const pid = createdIds[queueIdx[q]!]!;
    const st =
      q === 0
        ? WaitingStatus.IN_PROGRESS
        : q < 4
          ? WaitingStatus.WAITING
          : WaitingStatus.DONE;
    await prisma.waitingEntry.create({
      data: {
        patientId: pid,
        day: today,
        arrivedAt: addMinutes(setHours(today, 8), 10 + q * 25),
        status: st,
      },
    });
  }

  /* Paiements */
  const methods = ["CASH", "CARD", "CHEQUE", "TRANSFER"];
  for (let i = 0; i < createdIds.length; i++) {
    const pid = createdIds[i]!;
    await prisma.payment.create({
      data: {
        patientId: pid,
        amount: 45 + (i % 5) * 10,
        method: methods[i % methods.length],
        paidAt: subDays(today, i % 20),
        note: i % 4 === 0 ? "Acompte" : null,
      },
    });
    if (i % 3 === 0) {
      await prisma.payment.create({
        data: {
          patientId: pid,
          amount: 60,
          method: "CARD",
          paidAt: subDays(today, 2 + i),
          note: "Consultation",
        },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: doctor.id,
      action: "SEED_DEMO",
      resource: "System",
      meta: JSON.stringify({ marker: DEMO_MARKER, patients: createdIds.length }),
    },
  });

  console.log(
    `Seed OK (${DEMO_MARKER}) — ${createdIds.length} patients fictifs, RDV, file, paiements, documents.\n` +
      "Comptes : medecin@cabinet.local / Admin123! | secretaire@cabinet.local / Secret123!"
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
