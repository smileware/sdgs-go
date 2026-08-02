import type { Language } from '../types'

export const LANGUAGE_STORAGE_KEY = 'sustrend-language-v1'

const thaiPrivacy = [
  'สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ (สศช.) เก็บรวบรวมชื่อเล่น อายุ เพศ เบอร์โทรศัพท์ (เฉพาะที่ท่านเลือกกรอก) คำตอบ และผลลัพธ์ของเกม เพื่อดำเนินกิจกรรม วิเคราะห์ผลในภาพรวมของโครงการ และติดต่อกลับตามวัตถุประสงค์ของโครงการ',
  'ข้อมูลจะถูกจัดเก็บใน Supabase และ Google Sheets ซึ่งใช้เป็นระบบสำรอง โดยจำกัดการเข้าถึงเฉพาะผู้ดูแลที่ได้รับอนุญาต ทั้งนี้ผู้ให้บริการดังกล่าวอาจประมวลผลข้อมูลบนเซิร์ฟเวอร์ในต่างประเทศ',
  'ข้อมูลจะถูกเก็บรักษาไว้ไม่เกิน 180 วัน นับจากวันที่เก็บข้อมูล หลังจากนั้นจะถูกลบทิ้งอย่างปลอดภัย',
  'ท่านมีสิทธิขอเข้าถึง แก้ไข ลบข้อมูล หรือถอนความยินยอมที่ให้ไว้ได้ทุกเมื่อ โดยติดต่อ sdgs@nesdc.go.th หรือ เจ้าหน้าที่ประจำบูท และมีสิทธิร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.) หากเห็นว่าไม่ได้รับความเป็นธรรม',
]

const englishPrivacy = [
  'The Office of the National Economic and Social Development Council (NESDC) collects your nickname, age, gender, phone number (only if you choose to provide it), responses, and game results to conduct the activity, analyze the project’s overall results, and contact you for the purposes of the project.',
  'Your data will be stored in Supabase and Google Sheets, which is used as a backup system. Access is restricted to authorized administrators. These service providers may process your data on servers located outside Thailand.',
  'Your data will be retained for no longer than 180 days from the date of collection, after which it will be securely deleted.',
  'You may request access to, correction of, or deletion of your data, or withdraw your consent at any time by contacting sdgs@nesdc.go.th or a booth staff member. You also have the right to lodge a complaint with the Office of the Personal Data Protection Committee (PDPC) if you believe you have been treated unfairly.',
]

export const PLAYER_COPY = {
  th: {
    documentTitle: 'คุณคือใครใน SDGs 5P',
    splashLabel: 'กำลังเปิดเกม SDGs 5P',
    configuration: {
      title: 'ระบบยังไม่พร้อมใช้งาน',
      detail: 'กรุณาติดต่อทีมงานประจำบูธ',
    },
    start: {
      heading: 'คุณคือใครใน SDGs 5P',
      languageLabel: 'เลือกภาษา',
      thai: 'ไทย',
      english: 'EN',
      button: 'เริ่ม',
    },
    register: {
      back: 'ย้อนกลับ',
      eyebrow: 'รักอะไรอยู่?',
      headingPrefix: 'Swipe',
      headingHighlight: 'สิ่งที่คุณรัก',
      formHeading: 'ทำความรู้จักกันก่อนนะ',
      nickname: 'ชื่อเล่น',
      nicknamePlaceholder: 'กรอกชื่อเล่น',
      age: 'อายุ',
      agePlaceholder: 'กรอกอายุ',
      gender: 'เพศ',
      male: 'ชาย',
      female: 'หญิง',
      unspecified: 'ไม่ระบุ',
      phone: 'เบอร์โทรศัพท์',
      phonePlaceholder: 'กรอกเบอร์โทรศัพท์',
      privacyAria: 'ยอมรับนโยบายความเป็นส่วนตัว',
      privacyPrefix: 'รับทราบและให้ความยินยอมตาม',
      privacyLink: 'นโยบายความเป็นส่วนตัว',
      privacyTitle: 'นโยบายความเป็นส่วนตัว',
      privacyParagraphs: thaiPrivacy,
      close: 'ปิด',
      submit: 'ค้นหาตัวเอง',
      submitting: 'กำลังเตรียมเกม…',
      consentError: 'กรุณายอมรับนโยบายความเป็นส่วนตัวก่อนเริ่มเกม',
      phoneError: 'กรุณาตรวจสอบรูปแบบเบอร์โทรศัพท์',
      submitError: 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง',
    },
    game: {
      question: 'คุณรักที่จะทำสิ่งนี้หรือไม่?',
      pass: 'อาจจะยัง',
      like: 'รักเลย',
      instruction: 'ลากการ์ดซ้าย/ขวา หรือกดปุ่ม',
    },
    result: {
      resultFor: (nickname: string) => `ผลลัพธ์ของ ${nickname}`,
      home: 'กลับหน้าแรก',
      youAre: 'คุณคือ...',
      balancedTitleParts: ['ผู้', 'สมดุล', 'ใน', 'ทุก', 'ด้าน'],
      balancedAria: 'สมดุลทั้ง 5 ด้าน',
      strength: 'จุดแข็ง',
      weakness: 'จุดอ่อน',
      shareButton: 'แชร์',
      replay: 'เล่นอีกครั้ง',
      creatingImage: 'กำลังสร้างภาพ…',
      saveImage: 'บันทึกภาพ',
      imageError: 'ไม่สามารถสร้างภาพผลลัพธ์ได้ กรุณาลองใหม่',
      devSaved: 'บันทึก PNG สำหรับทดสอบแล้ว',
      choosePhotoSave: 'เลือก “บันทึกรูปภาพ” หรือ “Add to Photos”',
      photoMenuClosed: 'ปิดเมนูบันทึกรูปแล้ว',
      photoUnsupported: 'อุปกรณ์นี้ไม่รองรับการบันทึกลงคลังรูป จึงดาวน์โหลด PNG ให้แทน',
      saveCancelled: 'ยกเลิกการบันทึกภาพ',
      photoOpenFailed: 'เปิดคลังรูปไม่ได้ จึงดาวน์โหลด PNG ให้แทน',
      shared: 'แชร์ภาพแล้ว',
      shareOpened: 'เปิดหน้าต่างแชร์แล้ว กรุณาเลือกแอปที่ต้องการ',
      shareUnsupported: 'อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์ภาพ จึงบันทึกภาพให้แล้ว',
      shareFailed: 'เปิดการแชร์ไม่ได้ จึงบันทึกภาพให้แทน',
    },
  },
  en: {
    documentTitle: 'Who Are You in the SDGs 5Ps?',
    splashLabel: 'Opening the SDGs 5Ps game',
    configuration: {
      title: 'The game is not ready yet',
      detail: 'Please contact the event team.',
    },
    start: {
      heading: 'Who Are You in the SDGs 5Ps?',
      languageLabel: 'Select language',
      thai: 'ไทย',
      english: 'EN',
      button: 'Start',
    },
    register: {
      back: 'Back',
      eyebrow: 'What do you love?',
      headingPrefix: 'Swipe',
      headingHighlight: 'what you love',
      formHeading: "Let's get to know you",
      nickname: 'Nickname',
      nicknamePlaceholder: 'Enter your nickname',
      age: 'Age',
      agePlaceholder: 'Enter your age',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      unspecified: 'Prefer not to say',
      phone: 'Phone number',
      phonePlaceholder: 'Enter your phone number',
      privacyAria: 'Accept the Privacy Policy',
      privacyPrefix: 'I acknowledge and consent to the',
      privacyLink: 'Privacy Policy',
      privacyTitle: 'Privacy Policy',
      privacyParagraphs: englishPrivacy,
      close: 'Close',
      submit: 'Discover yourself',
      submitting: 'Preparing the game…',
      consentError: 'Please accept the Privacy Policy before starting the game.',
      phoneError: 'Please check the phone number format.',
      submitError: 'We could not save your information. Please try again.',
    },
    game: {
      question: 'Would you love to do this?',
      pass: 'Maybe not yet',
      like: 'Love it',
      instruction: 'Swipe left or right, or tap a button',
    },
    result: {
      resultFor: (nickname: string) => `Result for ${nickname}`,
      home: 'Back to home',
      youAre: 'You are...',
      balancedTitleParts: ['Balanced', 'in', 'All', '5', 'Dimensions'],
      balancedAria: 'Balanced across all five dimensions',
      strength: 'Your strength',
      weakness: 'Growth area',
      shareButton: 'Share',
      replay: 'Play again',
      creatingImage: 'Creating image…',
      saveImage: 'Save image',
      imageError: 'We could not create your result image. Please try again.',
      devSaved: 'Test PNG saved.',
      choosePhotoSave: 'Choose “Save Image” or “Add to Photos”.',
      photoMenuClosed: 'The save menu was closed.',
      photoUnsupported: 'This device cannot save directly to Photos, so the PNG was downloaded instead.',
      saveCancelled: 'Image save cancelled.',
      photoOpenFailed: 'Photos could not be opened, so the PNG was downloaded instead.',
      shared: 'Image shared.',
      shareOpened: 'The share menu is open. Please choose an app.',
      shareUnsupported: 'This device cannot share image files, so the image was saved instead.',
      shareFailed: 'Sharing could not be opened, so the image was saved instead.',
    },
  },
} as const

export type PlayerCopy = (typeof PLAYER_COPY)[Language]

export const getStoredLanguage = (): Language => {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return stored === 'en' || stored === 'th' ? stored : 'th'
  } catch {
    return 'th'
  }
}
