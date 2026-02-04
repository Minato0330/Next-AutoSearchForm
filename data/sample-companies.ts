/**
 * Sample company data for testing
 * Replace with your actual company list
 */

import { CompanyInput } from "../lib/types";

export const sampleCompanies: CompanyInput[] = [
  { name: "GMOインターネットグループ", url: "https://group.gmo/" },
  { name: "ディー・エヌ・エー", url: "https://dena.com/jp/" },
  { name: "カカクコム", url: "https://corporate.kakaku.com/" },
  { name: "マネーフォワード", url: "https://corp.moneyforward.com/" },
  { name: "freee", url: "https://corp.freee.co.jp/" },
  { name: "ラクス", url: "https://www.rakus.co.jp/" },
  { name: "SCSK", url: "https://www.scsk.jp/" },
  { name: "TIS", url: "https://www.tis.co.jp/" },
  { name: "オムロン", url: "https://components.omron.com/" },
  { name: "京セラ", url: "https://www.kyocera.co.jp/" },
  { name: "TDK", url: "https://www.tdk.com/ja/" },
  { name: "ファナック", url: "https://www.fanuc.co.jp/" },
  { name: "安川電機", url: "https://www.yaskawa.co.jp/" },
  { name: "ローム", url: "https://www.rohm.co.jp/" },
  { name: "シャープ", url: "https://corporate.jp.sharp/" },
  { name: "ミネベアミツミ", url: "https://www.minebeamitsumi.com/" },
  { name: "ダイキン工業", url: "https://www.daikincc.com/" },
  { name: "SMC", url: "https://www.smcworld.com/" },
  { name: "コマツ", url: "https://www.komatsu.jp/ja/" },
  { name: "クボタ", url: "https://www.kubota.co.jp/" },
  { name: "荏原製作所", url: "https://www.ebara.co.jp/" },
  { name: "スズキ", url: "https://www.suzuki.co.jp/corporate/" },
  { name: "マツダ", url: "https://www.mazda.co.jp/" },
  { name: "SUBARU", url: "https://www.subaru.co.jp/" },
  { name: "いすゞ自動車", url: "https://www.isuzu.co.jp/" },
  { name: "ヤマハ発動機", url: "https://www.yamaha-motor.co.jp/" },
  { name: "良品計画", url: "https://contact.muji.com/" },
  { name: "ビックカメラ", url: "https://www.biccamera.co.jp/" },
  { name: "ヤマダHD", url: "https://www.yamada-holdings.jp/" },
  { name: "ドンキホーテ(PPIH)", url: "https://ppih.co.jp/" },
  { name: "コスモス薬品", url: "https://www.cosmospc.co.jp/" },
  { name: "日清食品HD", url: "https://www.nissin.com/jp/" },
  { name: "明治HD", url: "https://www.meiji.co.jp/" },
  { name: "ヤクルト本社", url: "https://www.yakult.co.jp/" },
  { name: "カルビー", url: "https://faq.calbee.co.jp/" },
  { name: "ニチレイ", url: "https://www.nichirei.co.jp/" },
  { name: "三菱ケミカルG", url: "https://www.mcgc.com/" },
  { name: "富士フイルムHD", url: "https://holdings.fujifilm.com/" },
  { name: "日東電工", url: "https://www.nitto.com/jp/" },
  { name: "ユニ・チャーム", url: "https://www.unicharm.co.jp/" },
  { name: "住友不動産", url: "https://www.sumitomo-rd.co.jp/" },
  { name: "東急不動産HD", url: "https://www.tokyu-fudosan-hd.co.jp/" },
  { name: "鹿島建設", url: "https://www.kajima.co.jp/" },
  { name: "大成建設", url: "https://www.taisei.co.jp/about_us/" },
  { name: "清水建設", url: "https://www.shimz.co.jp/" },
  { name: "オリックス", url: "https://www.orix.co.jp/" },
  { name: "東京センチュリー", url: "https://www.tokyocentury.co.jp/" },
  { name: "日本電産(ニデック)", url: "https://www.nidec.com/jp/" },
  { name: "HOYA", url: "https://www.hoya.com/" },
  { name: "テルモ", url: "https://www.terumo.co.jp/" },
  // Add more companies here
  // You can extend this list to ~300 companies for full analysis
  // Format: { name: "Company Name", url: "https://company-url.com" }
];

/**
 * Load companies from various sources
 * This can be extended to load from CSV, API, LinkedIn, etc.
 */
export async function loadCompanies(): Promise<CompanyInput[]> {
  // For now, return sample companies
  // TODO: Implement CSV loading, API integration, etc.
  return sampleCompanies;
}

