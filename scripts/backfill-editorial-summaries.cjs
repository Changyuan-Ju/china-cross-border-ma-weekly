const fs = require("node:fs");
const { PrismaClient } = require("@prisma/client");

loadEnvFile(".env");

const prisma = new PrismaClient();

const editorialSummaries = {
  "deal-shengtun-nkoyi-20260408":
    "7月10日，盛屯矿业（600711.SH）公告，全资孙公司Preeminence已完成向Novel Mining收购Nkoyi Leopard Mining and Investment Limited 50%普通股，股东名册及董事、高管变更登记均已办理，并已按协议支付3亿美元分期收购价款。Nkoyi持有位于刚果（金）科卢韦齐西侧特定铜钴矿采矿权60%权益，盛屯矿业由此间接取得该矿权30%权益。交易通过宏盛国际下属境外平台实施，交割后Nkoyi仍为参股公司、不纳入合并报表。本次收购进一步增加公司在刚果（金）的铜钴资源权益，为后续资源开发和海外矿业布局提供补充。",
  "deal-shengyang-triax-20260710":
    "7月10日，盛洋科技（603703.SH）公告，控股子公司FTA拟向Glenn Vaughan现金收购英国Triax UK Limited 100%股权。股权购买对价为330万英镑，交割时另扣付12.5万英镑卖方个人应付款，并在交割后两个工作日内支付89万英镑结清标的对Nordea银行债务，项目总资金需求为419万英镑。Triax主要提供电视前端、天线、卫星接收终端及音视频和数据信号分发解决方案，业务覆盖英国、欧洲、非洲及中东。交易已获董事会批准、无需提交股东会，交割后Triax将纳入合并报表，有助于盛洋科技补充欧洲本地产品、渠道和客户服务能力。",
  "deal-xinrui-winwin-thailand-20260710":
    "7月10日，新锐股份（688257.SH）公告，在拟以8亿元收购慧联电子80%股权的一揽子交易中，公司同时计划使用不超过人民币2,800万元自有资金收购WINWIN HITECH (THAILAND) CO., LTD. 70%股权。该泰国标的承接慧联电子海外相关业务，涉及PCB刀具及海外制造布局；本次公告披露了投资上限和收购比例，但未单独披露卖方、标的财务数据及详细付款安排。交易已获董事会审议通过，尚待股东会批准。交割后新锐股份将取得泰国标的控制权，并与境内慧联电子控制权收购联动实施，以解决同业竞争并拓展海外市场。",
  "deal-mayair-hk-minority-20260509":
    "7月8日，美埃科技（688376.SH）公告，已完成向Ng Yew Sum等四名管理层及少数股东收购MayAir HK Holdings Limited合计535股股份，占标的18.36%股权，股份登记手续已于7月7日完成。交易对价为人民币116,447,772.71元或等值外币，全部以现金支付；完成后公司对MayAir HK的持股比例由68.39%提升至86.75%，控制权不发生变化。MayAir HK为香港投资控股平台，持有捷芯隆相关洁净室业务。本次交易进一步收拢境外控股平台的少数股东权益，提升上市公司对相关业务的经济权益和管理协同。",
  "deal-jack-comelz-20260423":
    "7月7日，杰克科技（603337.SH）就收购意大利Comelz S.p.A. 100%股权披露融资安排更新。为支持全资子公司Bullmer Italia实施收购，拓卡奔马拟向招商银行申请不超过5,000万欧元融资性保函，并由杰克科技提供连带责任反担保；此前公司已为交易购买价、交易成本及控制权变更贷款偿还提供不超过1.4亿欧元履约担保。Comelz主要从事鞋服皮革行业自动裁剪设备及相关技术业务。本次公告并非首次交易披露，未更新最终收购价款及交割时间，核心进展是落实跨境价款支付所需的银行融资和担保安排。",
  "deal-kexin-zhike-20260707":
    "7月7日，科创新源（300731.SZ）公告，公司及香港科创正推进以合计2.45亿元收购东莞兆科及ZHIKE TECHNOLOGY PTE. LTD.控制权的一揽子交易。境内标的东莞兆科已完成工商变更，公司已支付其对应价款20%即4,665万元；香港科创与卖方仍在办理新加坡智科的股权交割，境外标的分拆对价未单独披露。新加坡智科计划持有中国台湾兆科科技及越南兆科科技等导热材料业务。交易完成后，公司将形成境内外协同的导热材料平台；本次进展显示境内部分已完成、境外控制权收购仍在执行中。",
  "deal-jiahe-beyerdynamic-20260706":
    "7月6日，佳禾智能（300793.SZ）公告，全资子公司佳禾国际已完成收购德国beyerdynamic GmbH & Co. KG全部有限合伙权益、普通合伙人BEYER DYNAMIC Verwaltungs-GmbH全部股份及约定股东借款。相关交割条件已满足，商业登记簿变更完成，公司已支付1.22亿欧元初步收购价款，最终价款仍将按收购协议约定机制调整。beyerdynamic主要从事专业耳机、麦克风及会议音频设备等业务。交割后佳禾智能取得标的100%表决权和控制权，有助于公司获得国际专业音频品牌、研发能力及海外渠道，并与现有声学产品制造业务形成协同。",
  "deal-jpt-neoptics-20260704":
    "7月4日，杰普特（688025.SH）公告，新加坡全资子公司JPT Opto-Electronics拟向公司董事兼总经理成学平现金收购NEOPTICS PTE. LTD. 100%股权，交易对价为112万新加坡元，定价以标的实缴资本为基础，工商变更完成后十个工作日内付款。NEOPTICS及其泰国子公司主要从事光器件研发、生产和销售，本次交易构成与关联自然人的股权收购，已获董事会及独立董事专门会议批准。交割后标的将纳入上市公司合并报表，有助于杰普特整合新加坡和泰国的光器件业务资源并强化海外经营平台。",
  "deal-linkutec-northstar-20260703":
    "7月3日，联动科技（301369.SZ）公告，全资子公司香港联动与Renaissance Maverick Corp.签署股份购买协议，拟以现金1,000万美元收购Northstar Technologies Limited 100%股权。交易采用锁箱机制，锁箱日为2026年4月30日；交割时200万美元进入托管账户、800万美元支付卖方，除协议约定的价值漏损外不作其他价格调整。Northstar主要从事半导体存储测试设备相关业务，拥有菲律宾研发制造基地及多家国际客户。交易已获董事会批准、无需提交股东会，交割后标的将纳入合并报表，有助于公司补充海外研发制造能力及客户资源。",
  "deal-oriental-yuhong-world-hardware-20260702":
    "7月2日，东方雨虹（002271.SZ）公告，香港东方雨虹收购The Universal Hardware & Plastic Factory Limited（世界五金塑胶厂有限公司）100%股权已完成交割。交易企业价值约1.6410亿港元，最终价款将根据交割日净现金及营运资金调整，并由买方在交割后45个工作日内编制交割账目确认。标的在香港注册，通过中山环宇实业从事CPVC、UPVC等管道及管件的生产销售；交易已履行董事会审批及境外投资备案等程序。交割后标的纳入上市公司体系，有助于东方雨虹补充管道管件产品能力并延伸建筑建材业务布局。",
  "deal-haoyang-follow-me-20260701":
    "7月1日，浩洋股份（300833.SZ）公告，全资子公司浩洋（香港）投资控股有限公司已与Keylight Holding B.V.等三名卖方签署股份购买协议，拟以现金266.855万欧元收购Follow-Me Holding B.V. 66.67%股权。Follow-Me成立于荷兰，主要研发、制造和销售舞台艺人追踪系统，产品应用于大型巡演、主题乐园、剧院及广播制作等场景。交易已获董事会批准、无需提交股东会，不构成关联交易或重大资产重组；交割后标的将纳入合并报表，有助于浩洋股份补充舞台智能追踪控制产品线并强化专业演艺设备解决方案能力。",
  "deal-xingye-yinxi-atlas-tin-20260701":
    "7月1日，兴业银锡（000426.SZ）公告，公司及兴业黄金（香港）与丰田通商、日铁矿业签署股份购买协议，拟由指定的新设海外子公司以2,311.357万美元现金收购Atlas Tin SAS剩余25%股权，其中分别受让20%和5%。交易前公司海外平台间接持有标的75%股权，交割后将持有100%股权并终止原股东协议。Atlas Tin持有摩洛哥Achmmach锡矿项目及相关采矿、勘探许可，项目处于建设前准备阶段。交易已获董事会批准、无需提交股东会，将进一步集中项目权益和决策权，为后续矿山建设及海外锡资源开发奠定基础。"
};

async function main() {
  const deals = await prisma.deal.findMany({
    orderBy: [{ latestAnnouncementDate: "desc" }, { id: "asc" }],
    select: {
      id: true,
      buyerNameCn: true,
      buyerTicker: true,
      targetNameCn: true,
      targetCountry: true,
      targetBusiness: true,
      sellerNames: true,
      stakeBefore: true,
      stakeChange: true,
      stakeAfter: true,
      obtainsControl: true,
      considerationText: true,
      paymentMethods: true,
      latestAnnouncementDate: true,
      currentStage: true,
      currentStatus: true,
      articleTitle: true,
      articleBody: true,
      detailedSummary: true,
      transactionFacts: true,
      transactionStructure: true,
      targetProfile: true,
      approvalsAndConditions: true,
      keyDates: true
    }
  });

  if (process.argv.includes("--list")) {
    console.log(JSON.stringify(deals, null, 2));
    return;
  }

  const configuredIds = new Set(Object.keys(editorialSummaries));
  const databaseIds = new Set(deals.map((deal) => deal.id));
  const missing = deals.filter((deal) => !configuredIds.has(deal.id)).map((deal) => deal.id);
  const unknown = [...configuredIds].filter((id) => !databaseIds.has(id));
  if (missing.length || unknown.length) {
    throw new Error(`Summary coverage mismatch. Missing: ${missing.join(", ") || "none"}; unknown: ${unknown.join(", ") || "none"}`);
  }

  const checks = deals.map((deal) => {
    const summary = editorialSummaries[deal.id];
    return { id: deal.id, length: summary.length, changed: summary !== deal.detailedSummary };
  });
  const invalid = checks.filter((item) => item.length < 180 || item.length > 450);
  if (invalid.length) throw new Error(`Editorial summary length check failed: ${JSON.stringify(invalid)}`);

  if (!process.argv.includes("--apply")) {
    console.log(JSON.stringify({ mode: "dry-run", checks }, null, 2));
    return;
  }

  const before = await prisma.deal.findMany({ select: { id: true, detailedSummary: true } });
  await prisma.$transaction(
    Object.entries(editorialSummaries).map(([id, detailedSummary]) =>
      prisma.deal.update({ where: { id }, data: { detailedSummary, isManualSupplement: true } })
    )
  );
  const after = await prisma.deal.findMany({ select: { id: true, detailedSummary: true } });
  const beforeById = new Map(before.map((deal) => [deal.id, deal.detailedSummary]));
  const result = after.map((deal) => ({
    id: deal.id,
    beforeLength: beforeById.get(deal.id)?.length ?? 0,
    afterLength: deal.detailedSummary?.length ?? 0,
    updated: beforeById.get(deal.id) !== deal.detailedSummary
  }));
  console.log(JSON.stringify({ mode: "apply", updated: result.filter((item) => item.updated).length, result }, null, 2));
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Editorial summary backfill failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
