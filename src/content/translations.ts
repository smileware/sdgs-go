import type { Language } from '../types'

export const LANGUAGE_STORAGE_KEY = 'sustrend-language-v1'

const thaiPrivacy = [
  'โครงการเก็บชื่อเล่น อายุ เพศ เบอร์โทรศัพท์ที่ท่านเลือกกรอก คำตอบ และผลลัพธ์ของเกม เพื่อดำเนินกิจกรรม วิเคราะห์ผลในภาพรวม และติดต่อกลับตามวัตถุประสงค์ของโครงการ',
  'ข้อมูลจะถูกจัดเก็บใน Supabase และ Google Sheets ซึ่งใช้เป็นระบบสำรอง โดยจำกัดการเข้าถึงเฉพาะผู้ดูแลที่ได้รับอนุญาต และเก็บรักษาตามระยะเวลาที่โครงการกำหนด',
]

const englishPrivacy = [
  'The project collects your nickname, age, gender, optional phone number, game responses, and result in order to run the activity, analyze aggregated outcomes, and contact you for the purposes of the project.',
  'Your information is stored in Supabase and Google Sheets, which serves as a backup. Access is limited to authorized administrators, and the data is retained for the period defined by the project.',
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
      privacyWarning: 'ทีมโครงการต้องแทนที่ข้อความนี้ด้วยนโยบายฉบับอนุมัติก่อนเปิดใช้งานจริง',
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
      shareHeading: 'แชร์ไปยัง',
      shareTo: (platform: string) => `แชร์ภาพไปยัง ${platform}`,
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
      platformUnsupported: (platform: string) => `อุปกรณ์นี้เปิด ${platform} โดยตรงไม่ได้ จึงบันทึกภาพให้แล้ว`,
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
      privacyWarning: 'The project team must replace this placeholder with the approved policy before launch.',
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
      balancedTitleParts: ['Balanced', 'Across', 'All', 'Five', 'Dimensions'],
      balancedAria: 'Balanced across all five dimensions',
      strength: 'Your strength',
      weakness: 'Growth area',
      shareHeading: 'Share to',
      shareTo: (platform: string) => `Share image to ${platform}`,
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
      platformUnsupported: (platform: string) => `This device cannot open ${platform} directly, so the image was saved instead.`,
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
