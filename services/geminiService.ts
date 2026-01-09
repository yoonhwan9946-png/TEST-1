
import { GoogleGenAI } from "@google/genai";
import { TrendResult, BrainstormItem, ExpansionType, BrainstormMode, LayoutAnalysisResult, AiInsightRequest, AiInsightResult, StyledCaptionResult } from '../types';

const getGeminiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API Key is missing");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const fetchTrendAnalysis = async (keyword: string): Promise<TrendResult | null> => {
  const ai = getGeminiClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the architectural trend keyword: "${keyword}". 
      Provide a brief professional description in Korean (max 2 sentences) and list 3 related visual concept keywords in Korean.
      Output format should be JSON with keys: "description" (string), "suggestedConcepts" (array of strings).`,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    return {
      keyword,
      description: data.description,
      suggestedConcepts: data.suggestedConcepts
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      keyword,
      description: "일시적인 오류로 분석 결과를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.",
      suggestedConcepts: ["데이터 없음", "재시도 요망"]
    };
  }
};

export const fetchBrainstormingTerms = async (
    keyword: string, 
    type: ExpansionType, 
    conditions: string[] = [],
    mode: BrainstormMode = 'BROAD',
    isCreativeMode: boolean = false // Added toggle for AI Creativity
): Promise<BrainstormItem[]> => {
    const ai = getGeminiClient();
    if (!ai) return [];

    const conditionText = conditions.length > 0 
        ? `Additional Context/Constraints: ${conditions.join(', ')}.` 
        : '';

    // 1. Creative Mode vs Strict Mode Instructions
    let generationPolicy = "";
    if (isCreativeMode) {
        generationPolicy = `
        **MODE: CREATIVE GENERATION (AI WORD GEN: ON)**
        - You act as a visionary design partner.
        - You ARE ALLOWED to invent new compound words, poetic metaphors, or futuristic concepts if they inspire design.
        - Focus on novelty, inspiration, and "What if" scenarios.
        - Sources are optional but recommended if based on existing theories.
        `;
    } else {
        generationPolicy = `
        **MODE: STRICT VERIFICATION (AI WORD GEN: OFF)**
        - You act as a strict Architectural Academic Librarian.
        - **DO NOT INVENT TERMS.** Only return terms that exist in architectural dictionaries, academic papers, or specific famous projects.
        - If a term is abstract, ensure it is a recognized concept in architectural theory (e.g., "Phenomenology", "Transparency", "Void").
        - **MANDATORY:** You MUST provide a specific, verifiable source (Paper title, Architect name, or Magazine issue) for every item.
        `;
    }

    // 2. Broad vs Deep Mode Instructions
    let depthInstruction = "";
    if (mode === 'DEEP') {
        depthInstruction = "FOCUS: Deep Dive. Provide specific technical details, construction methods, specific material names, or academic sub-theories.";
    } else {
        depthInstruction = "FOCUS: Broad Lateral Thinking. Connect to adjacent fields (Sociology, Art, Urbanism) or wider typologies.";
    }

    let promptContext = "";
    switch(type) {
        case 'ISSUE': // East
            promptContext = "Focus on current South Korean architectural ISSUES, debates, regulations, or social problems. (Korean)";
            break;
        case 'SIMILAR': // North
            promptContext = "Provide SYNONYMS, similar design methodologies, or related aesthetic styles. (Korean)";
            break;
        case 'OPPOSITE': // West
            promptContext = "Provide ANTONYMS, contrasting concepts, or opposing design philosophies. (Korean)";
            break;
        case 'ROOT':
             promptContext = "Provide DIVERSE, TRENDY, and fundamental architectural concepts related to this. Mix functionality, aesthetics, and social aspects. (Korean)";
             break;
        case 'AUTO': // South
        default:
            promptContext = "Provide the most relevant next-step design concepts, materials, or spatial elements. (Korean)";
            break;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
            Role: Expert Architectural Consultant.
            Task: Brainstorming expansion for the term: "${keyword}".
            
            ${generationPolicy}
            ${depthInstruction}
            ${promptContext}
            ${conditionText}
            
            Requirements:
            1. Output Language: **Korean** (English terms allowed in parentheses if technical).
            2. 'shortLabel': Concise (max 6-8 chars) for mind map visualization.
            3. 'term': Full name of the concept.
            4. 'description': Professional explanation.
            5. 'sources': Array of strings. If Strict Mode, this is required.
            6. Provide exactly 4 results.
            
            Return JSON array:
            [{ 
              "term": "...", 
              "shortLabel": "...", 
              "description": "...",
              "sources": ["Source 1", "Source 2"]
            }]`,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const text = response.text;
        if(!text) return [];
        const items = JSON.parse(text) as BrainstormItem[];
        
        return items.map(item => ({
            ...item,
            isAiGenerated: isCreativeMode // Flag is true only if creative mode was on
        }));

    } catch (error) {
        console.error("Brainstorming API Error:", error);
        return [
            { 
                term: "오류 발생", 
                shortLabel: "오류", 
                description: "데이터를 불러오지 못했습니다.",
                isAiGenerated: false
            }
        ];
    }
};

// --- New Function: Layout Narrative Analysis with Context ---
export const analyzeLayoutNarrative = async (
    descriptions: string[], 
    type: 'public' | 'business' = 'public'
): Promise<LayoutAnalysisResult | null> => {
    const ai = getGeminiClient();
    if (!ai) return null;

    const inputSequence = descriptions.join(', ');

    // Define persona and criteria based on project type
    let persona = "";
    let criteria = "";

    if (type === 'public') {
        persona = `당신은 엄격하고 논리적인 **'건축 현상설계 공모전 전문 심사위원'**이자 **'디자인 디렉터'**입니다.`;
        criteria = `
        1. **기승전결:** 분석(Site/Context) -> 전략(Concept/Massing) -> 해결(Plan/Section) -> 결과(Perspective)의 흐름이 논리적인가?
        2. **설득력:** 뜬금없이 도면이 나오거나, 근거 없이 투시도가 나오는 비논리적 배치를 찾아내십시오.
        3. **공공성 및 이슈 해결:** 사이트 분석에서 도출된 이슈가 디자인 전략으로 어떻게 연결되는지 중점적으로 보십시오.
        `;
    } else {
        persona = `당신은 깐깐하고 현실적인 **'민간 투자 사업(PF) 평가 위원'**이자 **'사업 기획 본부장'**입니다.`;
        criteria = `
        1. **사업성 및 실현 가능성:** 디자인뿐만 아니라, 사업 목표(Vision), 수지 분석(Finance), 운영 계획(Operation)이 적절한 위치에 배치되었는가?
        2. **신뢰도:** 팀 소개(Team)나 회사 실적 등 신뢰를 주는 요소가 초반부나 적절한 위치에 있어 발주처를 설득하고 있는가?
        3. **명확한 목표:** 프로젝트의 목표와 타겟층 분석이 명확히 선행되고 있는가?
        4. **밸런스:** 감성적인 이미지와 이성적인 수치(면적표, 사업성 분석)가 균형을 이루고 있는가?
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
            **Role:**
            ${persona}

            **Goal:**
            사용자가 입력한 [페이지별 콘텐츠 순서]를 분석하여, 심사위원이 설계안을 가장 직관적으로 이해하고 설득될 수 있는 **최적의 내러티브(Narrative) 구조**인지 평가하고 개선안을 제안하십시오.

            **Evaluation Criteria (심사 기준):**
            ${criteria}

            **User Input Sequence:**
            "${inputSequence}"

            **Output Format (JSON Only):**
            응답은 아래의 JSON 포맷으로만 출력하십시오. 모든 텍스트 값은 **한국어(Korean)**입니다.
            
            {
              "current_score": 0, // (Integer 0~100)
              "evaluation": "평가 내용 (사업 유형에 맞춰 전문적인 용어 사용)...", 
              "is_reorder_needed": true, // Boolean
              "better_sequence": ["1. 페이지내용", "2. 페이지내용", ...],
              "missing_suggestion": "누락된 요소(예: 사업수지표, 운영조직도, 법규검토 등)에 대한 제안..."
            }

            **Instruction:**
            - 사용자의 입력이 건축/사업적으로 말이 안 되는 순서라면 점수를 낮게 주고, 가차 없이 비판하십시오.
            - better_sequence에는 사용자가 입력한 내용을 재배치하되, 필요하다면 흐름상 더 좋은 단어로 수정하거나(예: '동선' -> '상업 시설 활성화 동선'), 없던 내용을 [추가 제안] 표시와 함께 넣을 수 있습니다.
            `,
            config: {
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text) as LayoutAnalysisResult;

    } catch (error) {
        console.error("Layout Analysis API Error:", error);
        return {
            current_score: 0,
            evaluation: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            is_reorder_needed: false,
            better_sequence: [],
            missing_suggestion: "오류 발생"
        };
    }
};

// --- Architectural Insight Generator (Archi-Speak & Checklist) ---
export const generateArchitecturalInsights = async (
    request: AiInsightRequest
): Promise<AiInsightResult | null> => {
    const ai = getGeminiClient();
    if (!ai) return null;

    const { project_info, page_context, action_type } = request;

    // Define Role & Persona
    const persona = `
    **Role:**
    당신은 건축 프로젝트의 성격(현상설계 vs 사업제안)과 용도(시설)를 깊이 이해하는 **수석 건축 디자이너(Chief Designer)**이자 **카피라이터**입니다.
    
    **Goal:**
    사용자가 현재 편집 중인 페이지의 정보(\`context\`)를 바탕으로, 요청 유형(\`action_type\`)에 따라 최적의 솔루션을 JSON 포맷으로 제공하십시오.
    `;

    // Instruction based on Action Type
    let instruction = "";
    if (action_type === 'generate_caption') {
        instruction = `
        **Action: "generate_caption" (Archi-Speak 생성)**
        - 사용자의 \`user_draft\`를 바탕으로 \`project_type\`에 맞는 어조로 3가지 버전을 생성하십시오.
        - **현상설계:** 건축적 담론, 도시적 맥락, 공공성 강조 (어휘: 보이드, 연계, 시퀀스, 투영, 공공기여).
        - **사업제안서:** 효율성, 수익성, 합리성, 명확한 기능 강조 (어휘: 전용률, 가시성, 접근성, 조닝, 앵커 테넌트).
        - **출력 옵션:**
            1. **Conceptual (개념적):** 디자인 의도와 철학 강조.
            2. **Functional (기능적):** 실제 작동 원리와 성능 강조.
            3. **Professional (전문적):** 가장 균형 잡힌 건축가 언어.
        
        **Output Format:**
        {
          "result_type": "caption",
          "options": {
            "conceptual": "...",
            "functional": "...",
            "professional": "..."
          }
        }
        `;
    } else if (action_type === 'recommend_checklist') {
        instruction = `
        **Action: "recommend_checklist" (다이어그램 체크리스트 제안)**
        - \`project_info\`와 \`page_role\`을 분석하여, 현재 페이지나 프로젝트 성격상 꼭 필요한 다이어그램을 추천하십시오.
        - 만약 \`page_role\`이 '매스 프로세스'라면, 해당 단계에서 누락되면 안 되는 분석 요소(채광, 조망, 법규 사선 등)를 제안하십시오.
        - 만약 '사업제안서'라면 면적표, 수익성 분석, MD 조닝 등을 제안하십시오.
        - **Search Keywords:** 아카이브 검색 가능한 영어 키워드를 제공하십시오.

        **Output Format:**
        {
          "result_type": "checklist",
          "advice": "프로젝트 성격에 맞춘 한 줄 조언...",
          "items": [
            {
              "name": "다이어그램 이름",
              "reason": "추천 이유...",
              "search_keyword": "English Search Keyword"
            }
          ]
        }
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
            ${persona}

            **Input Data:**
            ${JSON.stringify(request)}

            ${instruction}

            **Constraints:**
            - 한국어(Korean)로 응답하십시오. (search_keyword는 영어)
            - JSON 포맷만 출력하십시오.
            `,
            config: {
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text) as AiInsightResult;

    } catch (error) {
        console.error("AI Insight API Error:", error);
        return null;
    }
};

// --- New Function: Styled Caption Generator (Style Mimicry) ---
export const generateStyledCaption = async (
    referenceStyle: { title: string; description: string; },
    targetDraft: string,
    contextInfo?: { assetMetadata: any, pageDescription: string }
): Promise<StyledCaptionResult | null> => {
    const ai = getGeminiClient();
    if (!ai) return null;

    const hasDraft = targetDraft && targetDraft.trim().length > 0;

    let taskInstruction = "";
    if (hasDraft) {
        taskInstruction = `
        **Task: Style Transfer (Rewrite)**
        - Analyze the user's \`target_draft\` and rewrite it to match the tone, vocabulary level, and sentence structure of the \`reference_style\`.
        - Do not change the meaning, only the style.
        `;
    } else {
        taskInstruction = `
        **Task: Content Generation (Create from Context)**
        - The user has NOT provided a draft (draft is empty).
        - You must **GENERATE a new caption** for the diagram based on:
          1. The \`reference_style\` (Adopt this Tone & Manner)
          2. The \`context_info.assetMetadata\` (Tags/Category: What the diagram depicts)
          3. The \`context_info.pageDescription\` (Page Context: What the page is about)
        - Synthesize these inputs to create a professional caption that describes the diagram's role in the page's logic.
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
            **Role:**
            당신은 사용자의 글쓰기 스타일을 완벽하게 모방하는 **'건축 텍스트 스타일리스트'**입니다.

            ${taskInstruction}

            **Process:**
            1.  **스타일 분석 (Style Extraction):**
                * **어미(Ending):** 명사형 종결(~함, ~임)인가? 서술형(~입니다, ~한다)인가?
                * **어휘(Vocabulary):** 학술적/전문 용어(Mass, Void, Layer) 위주인가? 쉬운 일반어(덩어리, 빈 공간, 층) 위주인가?
                * **길이(Length):** 간결한 단문인가? 수식어가 많은 만연체인가?
                * **영문 병기:** 한글 뒤에 괄호로 영어를 병기하는 스타일인가? (예: 동선(Circulation))

            2.  **텍스트 생성 (Generation):**
                * 분석된 스타일 규칙을 엄격히 적용하여, \`generated_caption\`을 생성하십시오.
                * **절대** 사용자가 사용하지 않는 톤(예: 갑자기 지나치게 감성적이거나, 지나치게 딱딱한 말투)을 섞지 마십시오.

            **Input Data:**
            {
              "reference_style": ${JSON.stringify(referenceStyle)},
              "target_draft": "${targetDraft}",
              "context_info": ${JSON.stringify(contextInfo || {})}
            }

            **Output Format (JSON Only):**
            {
              "analysis": {
                "tone": "Academic & Logical", // (분석된 톤)
                "ending_style": "Noun_ending (~함)", // (분석된 어미)
                "vocabulary_level": "High (Technical Terms)" // (분석된 어휘)
              },
              "generated_caption": "..."
            }
            `,
            config: {
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text) as StyledCaptionResult;

    } catch (error) {
        console.error("Styled Caption API Error:", error);
        return null;
    }
};

// --- New Function: Classify Page Phases ---
export const classifyPagePhases = async (descriptions: { pageIndex: number; text: string }[]) => {
    const ai = getGeminiClient();
    if (!ai) return null;

    // Filter out empty descriptions to save tokens, but keep index for mapping back
    const validItems = descriptions.filter(d => d.text.trim().length > 0);
    if (validItems.length === 0) return [];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
            Role: Architectural Project Manager.
            Task: Classify each page description into one of the following categories (Phases).
            
            Categories:
            - 'analysis': Site analysis, context, legal, survey, intro.
            - 'strategy': Concept, massing, zoning, diagram, process.
            - 'plan': Floor plans, sections, elevations, drawings, core, parking.
            - 'design': Perspective, render, facade, interior design, cg.
            - 'finance': Budget, cost, profit, feasibility, sale, calc.
            - 'team': Organization, manpower, company history, partners.
            - 'vision': Goal, target, philosophy, mission.
            - 'excluded': Cover, index, contents, blank, spacer.

            Input List:
            ${JSON.stringify(validItems)}

            Output Requirements:
            - Return a JSON Array of objects: { "pageIndex": number, "phase": "category_name" }
            - Use ONLY the categories listed above.
            `,
            config: {
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text) as { pageIndex: number; phase: string }[];

    } catch (error) {
        console.error("Phase Classification API Error:", error);
        return [];
    }
};
