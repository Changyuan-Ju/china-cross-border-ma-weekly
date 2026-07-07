const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { PrismaClient } = require("@prisma/client");

loadEnvFile();

const prisma = new PrismaClient();
const verifiedAt = "2026-07-08T00:00:00.000Z";

const records = [
  {
    key: "liandong-northstar",
    match: { buyer: "联动科技", target: "Northstar" },
    update: {
      targetCountry: "中国香港",
      targetAssetLocation: "中国香港/菲律宾",
      targetIndustry: "半导体测试设备",
      targetBusiness: "存储测试设备相关技术及海外研发、制造和客户服务能力",
      stakeBefore: 0,
      stakeChange: 100,
      stakeAfter: 100,
      obtainsControl: true,
      considerationAmount: 10000000,
      considerationCurrency: "USD",
      considerationText: "1,000万美元",
      paymentMethods: ["现金"],
      detailedSummary:
        "联动科技全资子公司香港联动拟以现金1,000万美元收购 Northstar Technologies Limited 100%股权。公告披露交易已获董事会批准并签署股份购买协议，不构成关联交易或重大资产重组；交易采用锁箱机制，交割时200万美元进入托管账户、800万美元支付卖方。",
      transactionFacts:
        "2026年7月3日，联动科技第三届董事会第八次会议审议通过本次收购。同日，公司、香港联动与 Renaissance Maverick Corp. 签署股份购买协议，约定由香港联动收购 Northstar Technologies Limited 100%股权，交易对价为1,000万美元。",
      transactionStructure:
        "交割前 Renaissance Maverick Corp. 持有标的100%股权；交割后香港联动科技实业有限公司持有标的100%股权。交易以现金支付，锁箱日为2026年4月30日，除协议约定的价值漏损外不进行其他价格调整。",
      targetProfile: {
        name: "Northstar Technologies Limited",
        establishedAt: "2008-02-19",
        registeredAddress: "Unit C, 17/F, United Centre, 95 Queensway, Admiralty, Hong Kong",
        shareCapital: "USD 1,000,000",
        business: "半导体存储测试设备相关业务及海外研发、制造、客户资源",
        operatingFootprint: "公告披露标的拥有菲律宾研发及制造基地，并覆盖海外客户资源",
        customers: ["ONsemi", "Amkor", "SEMTECH", "Bosch", "Wolfspeed", "Littelfuse", "Vishay", "ST"]
      },
      targetFinancials: [{ period: "2026-04-30", metric: "财务报表", value: "公告披露以该日财务数据作为估值参考，具体收入、利润和净资产未在已截取文本中披露" }],
      considerationBreakdown: {
        totalConsideration: "USD 10,000,000",
        escrow: "USD 2,000,000",
        sellerPaymentAtClosing: "USD 8,000,000",
        payment: "现金",
        lockedBoxDate: "2026-04-30",
        adjustment: "除价值漏损外不进行其他价格调整"
      },
      pricingBasis:
        "公告披露交易对价基于法律、财务尽调、2026年4月30日财务数据、预期协同和资源整合价值，经交易各方商业谈判确定。",
      approvalsAndConditions: {
        boardApproval: "已于2026-07-03经董事会审议通过",
        shareholderApproval: "公告披露在董事会审批权限内，无需提交股东大会",
        relatedParty: "不构成关联交易",
        majorAssetRestructuring: "不构成重大资产重组",
        closingConditions: ["协议约定交割条件满足", "托管及价款支付安排落实"]
      },
      keyDates: { basisDate: "2026-04-30", agreement: "2026-07-03", announcement: "2026-07-03" },
      fieldEvidence: {
        consideration: "Wind公告记录披露交易对价为1,000万美元",
        stake: "Wind公告记录披露收购标的100%股权",
        pricing: "Wind公告记录披露以2026年4月30日财务数据等作为估值参考"
      },
      informationGaps: ["标的具体收入、净利润、净资产未在已截取公告文本中披露", "完整交割条件未逐项披露", "公开公告链接未取得"]
    },
    sources: [{ title: "联动科技:关于收购Northstar Technologies Limited 100%股权的公告", date: "2026-07-03", type: "initial", stage: "agreement_signed" }]
  },
  {
    key: "xingye-atlas",
    match: { buyer: "兴业银锡", target: "Atlas" },
    update: {
      targetCountry: "摩洛哥",
      targetAssetLocation: "Achmmach锡矿",
      targetIndustry: "锡矿资源",
      targetBusiness: "Atlas Tin SAS 持有摩洛哥 Achmmach 锡矿项目及相关采矿、勘探许可",
      stakeBefore: 75,
      stakeChange: 25,
      stakeAfter: 100,
      obtainsControl: true,
      considerationAmount: 23113570,
      considerationCurrency: "USD",
      considerationText: "2,311.357万美元",
      paymentMethods: ["现金"],
      detailedSummary:
        "兴业银锡拟通过新设海外子公司收购 Atlas Tin SAS 剩余25%股权，总对价2,311.357万美元。交割后，公司将通过海外平台间接持有 Atlas Tin SAS 100%股权，并终止原股东协议，进一步完整控制 Achmmach 锡矿项目权益。",
      transactionFacts:
        "2026年6月30日，兴业银锡及兴业黄金（香港）与 Toyota Tsusho Corporation、Nittetsu Mining Co., Ltd. 签署股份购买协议，拟分别收购20%和5%股权。董事会已审议通过，公告披露无需提交股东大会。",
      transactionStructure:
        "交易由公司指定的新设海外子公司作为最终受让方。收购前兴业黄金（香港）下属 Atlantic Tin 持有 Atlas Tin SAS 75%股权；收购完成后，公司海外平台将合计持有100%股权，原股东协议及相关权利义务在交割后终止/解除。",
      targetProfile: {
        name: "Atlas Tin SAS",
        asset: "Achmmach锡矿",
        country: "摩洛哥",
        miningLicense: "332912，公告披露有效期至2032-01-17",
        plannedCapacity: "年采矿能力120万吨",
        projectStatus: "处于建设前准备阶段",
        permits: "公告披露拥有勘探临时占用许可、采矿经营临时占用许可及环境社会影响评估批复/更新"
      },
      targetFinancials: [{ metric: "财务影响", value: "公告披露标的已纳入合并范围，本次少数股权收购对当期利润不构成重大影响；具体财务报表数据未披露" }],
      considerationBreakdown: {
        toyotaTsusho: "USD 15,300,000，对应20%股权",
        nittetsuMining: "USD 7,813,570，对应5%股权",
        totalConsideration: "USD 23,113,570",
        payment: "自有或自筹资金现金支付"
      },
      pricingBasis:
        "公告重点披露交易目的在于完整控制项目资源权益、终止股东协议、简化治理结构；已截取公告文本未披露估值倍数或收益法/市场法定价参数。",
      approvalsAndConditions: {
        boardApproval: "已于2026-06-30经董事会审议通过",
        shareholderApproval: "公告披露无需提交股东大会",
        relatedParty: "不构成关联交易",
        majorAssetRestructuring: "不构成重大资产重组",
        closingConditions: ["新设海外子公司完成设立并作为指定受让方", "协议约定交割条件满足", "原股东协议终止/解除文件生效"]
      },
      keyDates: { agreement: "2026-06-30", announcement: "2026-07-01", miningLicenseExpiry: "2032-01-17" },
      fieldEvidence: {
        stake: "Wind公告记录披露收购 Toyota Tsusho 20%及 Nittetsu Mining 5%股权",
        consideration: "Wind公告记录披露两项交易对价合计2,311.357万美元",
        asset: "Wind公告记录披露标的持有 Achmmach 锡矿项目权益"
      },
      informationGaps: ["标的详细收入、利润、净资产未在已截取公告文本中披露", "最终新设海外子公司名称未披露", "交割日期未披露", "公开公告链接未取得"]
    },
    sources: [{ title: "兴业银锡:关于收购 Atlas Tin SAS 25%股权的公告", date: "2026-07-01", type: "initial", stage: "agreement_signed" }]
  },
  {
    key: "haoyang-follow-me",
    match: { buyer: "浩洋股份", target: "Follow-Me" },
    update: {
      targetCountry: "荷兰",
      targetAssetLocation: "荷兰",
      targetIndustry: "演艺设备与舞台智能追踪系统",
      targetBusiness: "专业演出及艺人追踪系统研发、制造、销售和技术服务",
      stakeBefore: 0,
      stakeChange: 66.67,
      stakeAfter: 66.67,
      obtainsControl: true,
      considerationAmount: 2668550,
      considerationCurrency: "EUR",
      considerationText: "266.855万欧元",
      paymentMethods: ["现金"],
      detailedSummary:
        "浩洋股份全资子公司浩洋（香港）投资控股有限公司拟以现金266.855万欧元收购 Follow-Me Holding B.V. 66.67%股权。交割后，标的将纳入公司合并报表范围，补齐公司在舞台智能追踪控制系统方面的产品线。",
      transactionFacts:
        "2026年6月30日，浩洋（香港）投资控股有限公司与 Keylight Holding B.V.、Wel Ventures B.V.、Erik Berends Beheer B.V. 签署股份购买协议，收购 Follow-Me Holding B.V. 66.67%股权。董事会已审议通过，公告披露无需提交股东大会。",
      transactionStructure:
        "本次交易为境外全资子公司现金收购荷兰目标公司控股权。交割后，浩洋股份通过香港子公司持有 Follow-Me Holding B.V. 66.67%股权并纳入合并范围。",
      targetProfile: {
        name: "Follow-Me Holding B.V.",
        country: "荷兰",
        establishedAt: "2013年",
        business: "专业演出艺人追踪系统研发、制造、销售及技术服务",
        product: "手动及自动艺人追踪系统、实时3D舞台艺人追踪技术、RF自动追踪系统",
        customersAndUseCases: "公告披露产品应用于大型巡演、欧洲歌唱大赛、主题乐园、剧院及广播制作等场景",
        competitivePosition: "公告披露为全球专业演艺追踪系统细分领域领先品牌"
      },
      targetFinancials: [{ metric: "财务数据", value: "公告披露定价参考标的财务数据、资产状况和盈利能力，但已截取文本未披露具体数值" }],
      considerationBreakdown: { totalConsideration: "EUR 2,668,550", stake: "66.67%", payment: "现金支付" },
      pricingBasis:
        "公告披露对价综合考虑标的行业影响力、品牌、技术、产品、销售渠道、业务发展趋势、盈利能力、财务数据和资产状况，并经交易各方协商确定。",
      approvalsAndConditions: {
        boardApproval: "已于2026-06-30经董事会审议通过",
        shareholderApproval: "公告披露无需提交股东大会",
        relatedParty: "不构成关联交易",
        majorAssetRestructuring: "不构成重大资产重组",
        closingConditions: ["协议约定交割条件满足"]
      },
      keyDates: { agreement: "2026-06-30", announcement: "2026-07-01" },
      fieldEvidence: {
        consideration: "Wind公告记录披露交易对价为266.855万欧元",
        stake: "Wind公告记录披露收购66.67%股权",
        targetBusiness: "Wind公告记录披露标的从事专业演出艺人追踪系统业务"
      },
      informationGaps: ["标的具体收入、净利润、净资产未在已截取公告文本中披露", "详细交割条件和预计交割日期未披露", "公开公告链接未取得"]
    },
    sources: [{ title: "浩洋股份:关于全资子公司收购股权的公告", date: "2026-07-01", type: "initial", stage: "agreement_signed" }]
  },
  {
    key: "oriental-yuhong-universal",
    match: { buyer: "东方雨虹", target: "世界五金" },
    update: {
      targetCountry: "中国香港",
      targetAssetLocation: "中国香港/中山",
      targetIndustry: "CPVC、UPVC管道及管件",
      targetBusiness: "生产和销售 CPVC、UPVC 等材质管道及管件",
      stakeBefore: 0,
      stakeChange: 100,
      stakeAfter: 100,
      obtainsControl: true,
      considerationAmount: 164100000,
      considerationCurrency: "HKD",
      considerationText: "约1.6410亿港元，最终按交割日净现金及营运资金调整",
      paymentMethods: ["现金"],
      currentStage: "completed",
      currentStatus: "completed",
      detailedSummary:
        "东方雨虹通过香港平台收购 The Universal Hardware & Plastic Factory Limited（世界五金塑胶厂有限公司）100%股权，公告披露企业价值约1.6410亿港元，最终价款按交割日净现金和营运资金调整。该交易已于本期进展公告中披露交割完成。",
      transactionFacts:
        "香港东方雨虹与 Aliaxis Group SA 及何氏家族卖方签署股份购买协议，收购世界五金塑胶厂有限公司100%股权。董事会已审议通过，交易不构成关联交易或重大资产重组；交易需办理境外投资相关备案/登记，并在满足条件后完成交割。",
      transactionStructure:
        "香港东方雨虹作为买方收购标的100%股权。交易价格以企业价值为基础，并根据交割日净现金和营运资金进行调整；交割后45个工作日内买方编制交割账目以确认最终调整金额。",
      targetProfile: {
        name: "The Universal Hardware & Plastic Factory Limited（世界五金塑胶厂有限公司）",
        registrationNumber: "01122679",
        establishedAt: "1961-02-24",
        registeredAddress: "Unit A&D, 22/F Nathan Commercial Building, 430-436 Nathan Road, Kowloon, Hong Kong",
        business: "生产和销售 CPVC、UPVC 等材质管道及管件",
        subsidiary: "中山环宇实业有限公司",
        subsidiaryBusiness: "塑料制品制造及销售、卫生洁具、五金批发零售及进出口业务"
      },
      targetFinancials: [{ period: "2025年", metric: "EBITDA", value: "HKD 29.493 million，折合约RMB 26.0178 million（公告披露）" }],
      considerationBreakdown: {
        enterpriseValue: "HKD 164.10 million",
        rmbEquivalent: "约RMB 144.76 million（按公告披露汇率口径）",
        adjustment: "交割日净现金及营运资金调整",
        trueUp: "交割后45个工作日内编制交割账目并确认最终调整",
        evToEbitda: "5.56x（公告披露）"
      },
      pricingBasis:
        "公告披露交易参考法律、财务、税务尽调结果，并采用收益法/自由现金流折现法进行估值；披露企业价值约1.6410亿港元，对应2025年EBITDA约5.56倍。",
      approvalsAndConditions: {
        boardApproval: "董事会已审议通过",
        shareholderApproval: "公告披露无需提交股东大会",
        regulatoryFilings: "需办理发改、商务、外汇等境外投资备案/登记",
        closingConditions: ["境外投资备案/登记完成", "无禁令、政府行动或法律障碍", "未发生重大不利影响", "过渡期正常经营"],
        completion: "本期进展公告披露交易已完成交割"
      },
      keyDates: { agreement: "2026-03-16", firstDisclosure: "2026-03-18", boardAnnouncement: "2026-04-10", completion: "2026-07-02" },
      fieldEvidence: {
        consideration: "Wind公告记录披露企业价值约1.6410亿港元",
        pricing: "Wind公告记录披露2025年EBITDA及EV/EBITDA倍数",
        completion: "既有本期周报记录显示2026-07-02交割完成"
      },
      informationGaps: ["已截取公告文本未披露完整收入、净利润和资产负债表数据", "最终交割调整后的价款金额未披露", "公开公告链接未取得"]
    },
    sources: [
      { title: "东方雨虹:关于签署《SHARE PURCHASE AGREEMENT(股份购买协议)》的公告", date: "2026-03-18", type: "initial", stage: "agreement_signed" },
      { title: "东方雨虹:关于收购世界五金塑胶厂有限公司100%股权的公告", date: "2026-04-10", type: "approval", stage: "agreement_signed" },
      { title: "东方雨虹:关于收购世界五金塑胶厂有限公司100%股权交割完成的公告", date: "2026-07-02", type: "completion", stage: "completed" }
    ]
  }
];

async function main() {
  const summary = { updatedDeals: 0, upsertedEvents: 0, upsertedSources: 0, missingDeals: [] };

  for (const record of records) {
    const deal = await findDeal(record.match);
    if (!deal) {
      summary.missingDeals.push(record.key);
      continue;
    }

    await prisma.deal.update({
      where: { id: deal.id },
      data: {
        ...record.update,
        lastVerifiedAt: new Date(verifiedAt),
        isManualSupplement: true
      }
    });
    summary.updatedDeals += 1;

    for (const source of record.sources) {
      const eventFingerprint = fingerprint(["wind_record", source.title, source.date]);
      await prisma.dealEvent.upsert({
        where: { sourceFingerprint: eventFingerprint },
        update: {
          dealId: deal.id,
          announcementDate: new Date(source.date),
          announcementType: source.type,
          transactionStage: source.stage,
          title: source.title,
          body: record.update.transactionFacts,
          evidence: record.update.fieldEvidence
        },
        create: {
          id: eventFingerprint,
          dealId: deal.id,
          announcementDate: new Date(source.date),
          announcementType: source.type,
          transactionStage: source.stage,
          title: source.title,
          body: record.update.transactionFacts,
          sourceData: [{ title: source.title, url: "", publisher: "Wind公告库", published_at: source.date, source_type: "wind_record", link_status: "not_publicly_available" }],
          evidence: record.update.fieldEvidence,
          sourceFingerprint: eventFingerprint
        }
      });
      summary.upsertedEvents += 1;

      const sourceFingerprint = fingerprint(["wind_record_source", source.title, source.date]);
      await prisma.dealSource.upsert({
        where: { sourceFingerprint },
        update: {
          dealId: deal.id,
          eventId: eventFingerprint,
          title: source.title,
          url: "",
          publisher: "Wind公告库",
          sourceType: "wind_record",
          isPrimary: source.date === record.sources[0].date,
          linkStatus: "not_publicly_available",
          lastVerifiedAt: new Date(verifiedAt),
          windRecordId: record.key,
          publishedAt: new Date(source.date)
        },
        create: {
          id: sourceFingerprint,
          dealId: deal.id,
          eventId: eventFingerprint,
          title: source.title,
          url: "",
          publisher: "Wind公告库",
          sourceType: "wind_record",
          isPrimary: source.date === record.sources[0].date,
          linkStatus: "not_publicly_available",
          lastVerifiedAt: new Date(verifiedAt),
          windRecordId: record.key,
          publishedAt: new Date(source.date),
          sourceFingerprint
        }
      });
      summary.upsertedSources += 1;
    }
  }

  console.log(JSON.stringify({ ok: true, ...summary }, null, 2));
}

async function findDeal(match) {
  return prisma.deal.findFirst({
    where: {
      OR: [
        { buyerNameCn: { contains: match.buyer } },
        { targetNameCn: { contains: match.target } },
        { targetNameEn: { contains: match.target } },
        { articleTitle: { contains: match.target } }
      ]
    },
    orderBy: { updatedAt: "desc" }
  });
}

function fingerprint(parts) {
  const normalized = parts.map((part) => String(part ?? "").trim().toLowerCase().replace(/\s+/g, " ")).filter(Boolean).join("|");
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 24);
}

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex < 1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Backfill failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
