// 按国家/地区分类的零售商
export const RETAILERS_BY_REGION = {
    // 欧洲 - 德国（含 Lidl、Aldi）
    germany: ['Lidl', 'Aldi', 'edeka', 'rewe', 'kaufland', 'metro', 'dm', 'rossmann', 'tchibo', 'mueller', 'netto', 'penny', 'norma', 'kik', 'tkmaxx'],

    // 欧洲 - 法国（含 Carrefour）
    france: ['Carrefour', 'E.Leclerc', 'Auchan', 'Casino', 'Kiabi', 'Boulanger', 'Cultura', 'La Maison du Monde', 'Gifi', 'Picard Surgelés', 'Nature & Découvertes', 'Groupe Lafayette', 'Système U', 'JouéClub', 'BUT'],

    // 欧洲 - 荷兰（含 Action）
    netherlands: ['Action', 'Albert Heijn', 'Jumbo', 'HEMA', 'Kruidvat', 'Plus', 'Etos', 'Dirk', 'Zeeman', 'Praxis', 'Gamma', 'Coolblue', 'Xenos', 'Karwei', 'Kwantum B.V'],

    // 欧洲 - 意大利
    italy: ['Conad', 'Coop', 'Esselunga', 'Eurospin', 'Iper', 'La grande i', 'Pam Panorama', 'MD Discount', 'Despar Italia', 'Todis', 'Unes Supermercati', 'Sigma', 'Famila Selex', 'Il Gigante', 'Unieuro', 'Tigotà', 'Arcaplanet'],

    // 欧洲 - 英国（含 Tesco）
    uk: ['B&M', 'The Works', 'Sainsbury\'s', 'Asda', 'Tesco', 'Waitrose', 'Dunelm', 'Home Bargains', 'The Range', 'Primark'],

    // 欧洲 - 北欧及瑞士
    nordics: ['Salling', 'Dagrofa', 'REMA 1000', 'Flying Tiger Copenhagen', 'Jysk', 'Normal', 'Silvan Byggemarked', 'Søstrene Grene', 'Kesko', 'Norgesgruppen', 'Europris', 'ICA Gruppen', 'Kronans Apotek', 'MIGROS', 'Landi'],

    // 欧洲 - 西班牙（含 Mercadona）
    spain: ['Mercadona', 'DIA', 'Eroski Group', 'Consum', 'SPAR', 'Ahorramas', 'El Corte Inglés', 'Condis', 'BonÀrea', 'Juguettos', 'Muy Mucho'],

    // 欧洲 - 波兰
    poland: ['Biedronka', 'Żabka', 'Dino', 'Lewiatan', 'Eurocash', 'Allegro', 'Stokrotka', 'LPP', 'Empik', 'Hebe', 'Pepco', 'PoloMarket', 'Media Expert', 'Sinsay'],

    // 北美 - 美国
    us: ['Walmart', 'Target', 'Costco', 'Kroger', 'CVS', 'Albertsons', 'Publix', 'TJX', 'Dollar General', 'Dollar Tree', 'Ross Stores', 'Burlington', 'Meijer', 'BJ\'s Wholesale', 'Macy\'s', 'JCPenney'],

    // 北美 - 加拿大 & 墨西哥
    canada_mexico: ['Weston', 'Dollarama Inc.', 'Empire Company Limited', 'Sobeys Inc.', 'Michaels Stores', 'Giant Tiger', 'Red Apple Stores', 'FEMSA (OXXO)', 'Liverpool', 'Coppel', 'Chedraui', 'Soriana', 'Mercado Libre', 'Casa Ley', 'La Comer'],

    // 大洋洲与非洲
    au_za: ['Shoprite Holdings', 'Pick n Pay', 'Massmart', 'Makro', 'Woolworths AU', 'Coles', 'Kmart Australia', 'Officeworks', 'The Reject Shop']
};

// 周日到周四发送，周五与周六不发送
// NOTE: 轮换顺序保持不变，只是发送日从周一~周五改为周日~周四
export const ROTATION_SCHEDULE = {
    0: ['germany', 'france'],               // 周日：德国、法国
    1: ['netherlands', 'italy', 'uk'],       // 周一：荷兰、意大利、英国
    2: ['nordics', 'spain'],                 // 周二：北欧、西班牙
    3: ['poland', 'us'],                     // 周三：波兰、美国
    4: ['canada_mexico', 'au_za'],           // 周四：加拿大/墨西哥、澳新/南非
    5: [],                                   // 周五：不发送
    6: [],                                   // 周六：不发送
};

// 每个地区的优先关注渠道：排期轮到时，这些渠道必须有 1-2 条资讯且放在最前面
export const PRIORITY_RETAILERS_BY_REGION: Record<string, string[]> = {
    germany: [],
    france: [],
    netherlands: ['HEMA'],
    italy: [],
    uk: ['B&M'],
    nordics: [],
    spain: [],
    poland: ['Biedronka', 'Sinsay'],
    us: [],
    canada_mexico: ['Dollarama'],
    au_za: [],
};

// 每个区域对应的 Google 搜索国家代码，确保搜索结果来自当地市场
export const GL_BY_REGION: Record<string, string> = {
    germany: 'de',
    france: 'fr',
    netherlands: 'nl',
    italy: 'it',
    uk: 'gb',
    nordics: 'dk',
    spain: 'es',
    poland: 'pl',
    us: 'us',
    canada_mexico: 'ca',
    au_za: 'au',
};

// 每个区域的通用行业搜索词，补充品牌搜索覆盖不到的行业资讯
export const INDUSTRY_QUERIES_BY_REGION: Record<string, string[]> = {
    germany: ['Germany retail supermarket industry news'],
    france: ['France retail grocery industry news'],
    netherlands: ['Netherlands retail store industry news'],
    italy: ['Italy retail grocery industry news'],
    uk: ['UK retail supermarket industry news'],
    nordics: ['Nordic Scandinavian retail industry news'],
    spain: ['Spain retail supermarket industry news'],
    poland: ['Poland retail store industry news'],
    us: ['US retail grocery supermarket industry news'],
    canada_mexico: ['Canada Mexico retail industry news'],
    au_za: ['Australia South Africa retail industry news'],
};

// 获取某天的搜索配置
export function getSearchConfigForDate(date: Date) {
    const dayOfWeek = date.getDay();

    // 周五(5)和周六(6)不生成
    if (dayOfWeek === 5 || dayOfWeek === 6) {
        return null;
    }

    const regionsToSearch = ROTATION_SCHEDULE[dayOfWeek as keyof typeof ROTATION_SCHEDULE];

    // 收集所有当天要搜索的具体零售商
    const rotationRetailers = Array.from(new Set(
        regionsToSearch.flatMap(region =>
            RETAILERS_BY_REGION[region as keyof typeof RETAILERS_BY_REGION]
        )
    ));

    // 收集当天轮到地区的优先关注渠道
    const priorityRetailers = regionsToSearch.flatMap(region =>
        PRIORITY_RETAILERS_BY_REGION[region] || []
    );

    // NOTE: 按区域分组的搜索配置，包含各区域的 gl 参数和行业搜索词
    const regionSearchGroups = regionsToSearch.map(region => ({
        region,
        retailers: RETAILERS_BY_REGION[region as keyof typeof RETAILERS_BY_REGION] || [],
        gl: GL_BY_REGION[region] || 'us',
        industryQueries: INDUSTRY_QUERIES_BY_REGION[region] || [],
    }));

    return {
        rotationRegions: regionsToSearch,
        rotationRetailers,
        priorityRetailers,
        queryTimeframe: 'qdr:w',
        regionSearchGroups,
    };
}
