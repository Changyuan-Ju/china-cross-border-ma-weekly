export const REGION_CATEGORIES = ["北美", "拉美", "欧洲", "非洲", "澳洲", "亚洲"] as const;

export const INDUSTRY_CATEGORIES = [
  "工业",
  "能源矿产",
  "TMT",
  "消费",
  "医疗健康",
  "农业食品",
  "建筑与基建",
  "物流运输",
  "商业服务",
  "其他"
] as const;

const REGION_RULES: Array<{ label: (typeof REGION_CATEGORIES)[number]; pattern: RegExp }> = [
  { label: "北美", pattern: /北美|north america|美国|united states|\busa\b|\bu\.s\.\b|加拿大|canada/ },
  { label: "拉美", pattern: /拉美|拉丁美洲|latin america|latam|南美|south america|中美洲|central america|巴西|brazil|秘鲁|peru|智利|chile|哥伦比亚|colombia|阿根廷|argentina|墨西哥|mexico/ },
  { label: "欧洲", pattern: /欧洲|europe|欧盟|\beu\b|德国|germany|意大利|italy|罗马尼亚|romania|法国|france|英国|united kingdom|\buk\b|西班牙|spain|波兰|poland|荷兰|netherlands|瑞士|switzerland|奥地利|austria/ },
  { label: "非洲", pattern: /非洲|africa|南非|south africa|埃及|egypt|摩洛哥|morocco|肯尼亚|kenya|尼日利亚|nigeria/ },
  { label: "澳洲", pattern: /澳洲|大洋洲|oceania|澳大利亚|australia|新西兰|new zealand/ },
  { label: "亚洲", pattern: /亚洲|asia|东南亚|southeast asia|东盟|asean|南亚|south asia|东亚|east asia|中国|china|日本|japan|韩国|korea|新加坡|singapore|印度|india|印度尼西亚|indonesia|菲律宾|philippines|越南|vietnam|泰国|thailand|马来西亚|malaysia|柬埔寨|cambodia|孟加拉国|bangladesh/ }
];

const INDUSTRY_RULES: Array<{ label: (typeof INDUSTRY_CATEGORIES)[number]; pattern: RegExp }> = [
  { label: "能源矿产", pattern: /能源|新能源|电池|锂|光伏|风电|石油|天然气|矿业|矿产|金属|采矿|铜|镍|钴|锌|黄金|energy|battery|mining|metal/ },
  { label: "TMT", pattern: /半导体|电子制造|消费电子|通信|电信|软件|互联网|数字|数据中心|人工智能|科技|信息技术|osat|semiconductor|electronics|telecom|software|technology|\bit\b/ },
  { label: "医疗健康", pattern: /医疗|医药|健康|制药|生物科技|器械|牙科|兽医|health|medical|pharma|biotech|dental|veterinary/ },
  { label: "农业食品", pattern: /农业|食品|饲料|养殖|畜牧|水产|宠物食品|农产品|agri|food|feed|farm/ },
  { label: "建筑与基建", pattern: /建筑|建材|水泥|基建|工程建设|construction|building material|cement|infrastructure/ },
  { label: "物流运输", pattern: /物流|供应链|运输|仓储|货运|港口|航运|快递|logistics|supply chain|transport|freight|shipping|warehouse/ },
  { label: "消费", pattern: /消费品|家居|家具|家电|美容|美发|服装|零售|品牌|儿童用品|consumer|retail|furniture|household|beauty|apparel/ },
  { label: "商业服务", pattern: /商业服务|专业服务|环境服务|废物|固废|污水|咨询|检测|认证|人力资源|business service|professional service|environmental service|waste|consulting|testing/ },
  { label: "工业", pattern: /工业|制造|机械|装备|零部件|汽车|木制品|橡胶|弹性体|塑料|冲压|齿轮|自动化|重型设备|industrial|manufactur|machinery|equipment|component|automotive|wood|rubber|elastomer/ }
];

export function normalizeRegion(value: string | null | undefined, country?: string | null) {
  const source = [value, country].filter(Boolean).join(" ").trim().toLowerCase();
  if (!source || /^(全球|global|未披露|unknown)$/.test(source)) return null;
  return REGION_RULES.find((rule) => rule.pattern.test(source))?.label ?? null;
}

export function normalizeIndustry(
  value: string | null | undefined,
  context: Array<string | null | undefined> = []
) {
  const source = [value, ...context].filter(Boolean).join(" ").trim().toLowerCase();
  if (!source) return null;
  return INDUSTRY_RULES.find((rule) => rule.pattern.test(source))?.label ?? "其他";
}
