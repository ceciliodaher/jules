document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const initialScreen = document.getElementById('initial-screen');
    const questionnaireScreen = document.getElementById('questionnaire-screen');
    const resultsScreen = document.getElementById('results-screen');

    // Buttons
    const startButton = document.getElementById('start-button');
    const nextSectionButton = document.getElementById('next-section-button'); // New ID
    const prevSectionButton = document.getElementById('prev-section-button'); // New ID
    const finishQuizButton = document.getElementById('finish-quiz-button');    // New ID
    const generatePdfButton = document.getElementById('generate-pdf-button');
    const completeButton = document.getElementById('complete-button');

    // Input/Output Elements
    const nameInput = document.getElementById('nome');
    const sectionTitle = document.getElementById('section-title');
    // const questionText = document.getElementById('question-text'); // Replaced by new container
    // const answerSelect = document.getElementById('answer-select'); // Replaced by selects in container
    const resultNome = document.getElementById('result-nome');
    const resultData = document.getElementById('result-data');
    const resultTemperamentoTipo = document.getElementById('result-temperamento-tipo');
    const scoreEmotividade = document.getElementById('score-emotividade');
    const scoreAtividade = document.getElementById('score-atividade');
    const scoreRessonancia = document.getElementById('score-ressonancia');
    const fatoresComplementaresResults = document.getElementById('fatores-complementares-results');

    // --- DATA (to be populated later) ---
    let allQuestionsData = []; // This will store the flattened list of all questions for PDF
    let currentQuestionIndex = 0; // Retained for PDF generation logic if it uses allQuestionsData
    let currentSectionIndex = 0; // New global for current section display
    let userAnswers = {}; // Store answers: { "Section Key": { questionIndex: "A/B/?" } }
    let userName = "";
    let calculatedResults = {}; // To store all results after calculation

    const QUESTIONARIOS = {
        "Emotividade": [
            "1. Quando algo não acontece como você deseja, ou 'sai pior' do que o previsto: Você fica interiormente muito nervoso (sem poder evitá-lo), embora nem sempre o demonstre externamente? (A) Ou aceita com calma interior os contratempos, sem ter que fazer grande esforço para isso, porque você é naturalmente tranquilo? (B)",
            "2. Quando você se encontra diante de um grande perigo ou de um acontecimento muito importante (exame, decisão grave...): Você se sente perturbado, inquieto, angustiado? (A) Ou permanece calmo, tranquilo, sereno? (B)",
            "3. Quando você assiste a um acidente ou a um espetáculo muito emotivo: Você se comove facilmente? (A) Ou permanece frio e calmo, sem deixar-se impressionar muito? (B)",
            "4. Depois de um acesso de cólera ou de um grande susto: Você fica muito tempo impressionado, sem poder esquecer o que aconteceu? (A) Ou se refaz rapidamente, sem pensar mais no assunto? (B)",
            "5. Quando alguém lhe conta uma piada muito engraçada: Você ri muito, com gargalhadas? (A) Ou apenas sorri, sem fazer muito barulho? (B)",
            "6. Quando você comete um erro ou uma gafe: Você fica muito tempo preocupado com isso, pensando no que fez? (A) Ou esquece rapidamente o incidente, sem lhe dar muita importância? (B)",
            "7. Quando você está em uma situação embaraçosa ou humilhante: Você fica vermelho, cora facilmente? (A) Ou permanece com a mesma cor, sem demonstrar exteriormente sua emoção? (B)",
            "8. Quando você recebe uma crítica ou uma observação desagradável: Você se sente ferido, atingido em seu amor próprio? (A) Ou permanece indiferente, sem se importar muito com o que disseram? (B)",
            "9. Quando você presencia uma injustiça ou um ato de crueldade: Você se revolta, fica indignado? (A) Ou permanece calmo, pensando que não adianta se exaltar? (B)",
            "10. Quando você tem que falar em público ou apresentar-se a pessoas importantes: Você se sente intimidado, com medo de não se sair bem? (A) Ou permanece à vontade, seguro de si mesmo? (B)"
        ],
        "Atividade": [
            "1. Quando você tem um trabalho urgente para fazer: Você precisa fazer um grande esforço para começar? (B) Ou o executa imediatamente, sem precisar se violentar? (A)",
            "2. Quando você está de férias ou tem um dia livre: Você gosta de ficar sem fazer nada, descansando? (B) Ou procura alguma ocupação, alguma atividade para se distrair? (A)",
            "3. Quando você tem que tomar uma decisão: Você hesita muito tempo, sem saber o que escolher? (B) Ou se decide rapidamente, sem muitas delongas? (A)",
            "4. Quando você tem um trabalho que não lhe agrada: Você o deixa de lado, esperando que outro o faça? (B) Ou o realiza assim mesmo, vencendo sua repugnância? (A)",
            "5. Quando você está diante de um obstáculo ou de uma dificuldade: Você desanima facilmente, pensando em desistir? (B) Ou se esforça para superá-lo, buscando novas soluções? (A)",
            "6. Quando você tem várias coisas para fazer ao mesmo tempo: Você se sente perdido, sem saber por onde começar? (B) Ou se organiza rapidamente, estabelecendo prioridades? (A)",
            "7. Quando você está em uma discussão ou em um debate: Você prefere ceder para evitar conflitos? (B) Ou defende suas opiniões com firmeza, mesmo que isso gere atritos? (A)",
            "8. Quando você tem um ideal ou um projeto em mente: Você se contenta em sonhar com ele, sem muito esforço para realizá-lo? (B) Ou se dedica com afinco à sua realização, empregando todos os seus recursos? (A)",
            "9. Quando você está cansado ou indisposto: Você interrompe suas atividades, procurando repouso? (B) Ou continua trabalhando, mesmo sentindo-se mal? (A)",
            "10. Quando você tem que agir em uma situação imprevista: Você fica paralisado, sem saber o que fazer? (B) Ou reage prontamente, tomando as medidas necessárias? (A)"
        ],
        "Ressonância": [
            "1. As impressões que você recebe (alegria, tristeza, medo...) deixam em você um eco profundo e duradouro? (A) Ou são superficiais e passageiras, desaparecendo rapidamente? (B)",
            "2. Você é uma pessoa que guarda rancor por muito tempo? (A) Ou perdoa e esquece facilmente as ofensas recebidas? (B)",
            "3. Seus hábitos e costumes são muito arraigados, e você tem dificuldade em mudá-los? (A) Ou você se adapta facilmente a novas situações e ambientes? (B)",
            "4. Você é uma pessoa que reflete muito antes de agir, analisando todas as consequências? (A) Ou age impulsivamente, sem pensar muito nas consequências? (B)",
            "5. Você é fiel aos seus princípios e convicções, mesmo que isso lhe traga aborrecimentos? (A) Ou muda de opinião facilmente, conforme as circunstâncias e as pessoas? (B)",
            "6. Seus afetos e amizades são profundos e duradouros, e você não os abandona facilmente? (A) Ou são superficiais e passageiros, e você muda de amigos com frequência? (B)",
            "7. Você é uma pessoa que termina tudo o que começa, mesmo que seja difícil ou demorado? (A) Ou desiste facilmente diante dos obstáculos, deixando as coisas inacabadas? (B)",
            "8. Você é pontual e exato em seus compromissos, horários e promessas? (A) Ou costuma se atrasar, esquecer ou adiar o que prometeu? (B)",
            "9. Suas opiniões e juízos são firmes e estáveis, e você não se deixa influenciar facilmente pelos outros? (A) Ou são variáveis e instáveis, e você muda de parecer com frequência? (B)",
            "10. Você é uma pessoa reservada, que não gosta de falar muito de si mesma nem de seus problemas? (A) Ou é expansivo e comunicativo, gostando de compartilhar suas alegrias e tristezas com os outros? (B)"
        ]
    };

    const FATORES_COMPLEMENTARES = {
        "Amplitude do Campo de Consciência": {
            "descricao_polos": ["Ampla", "Estreita"],
            "questoes": [
                "1. Quando você está ocupado, realizando alguma atividade interessante: Você rejeita por instinto tudo aquilo que lhe tira da ocupação em que está? (A) Ou acolhe estas perturbações sem irritar-se? (B)",
                "2. Estando em viagem, ou participando de uma reunião social: Você se interessa por tudo o que vê e ouve? (A) Ou sua atenção se fixa em poucas coisas, selecionando o que lhe interessa? (B)",
                "3. Você é capaz de realizar diversas tarefas ao mesmo tempo (ler e escutar, por exemplo)? (A) Ou precisa dedicar-se exclusivamente a uma só coisa para fazê-la bem? (B)",
                "4. Você se adapta facilmente a qualquer tipo de trabalho que lhe é proposto? (A) Ou prefere realizar sempre as mesmas tarefas, que já conhece bem? (B)",
                "5. Você tem muitos e variados interesses, ou sua curiosidade se limita a poucos assuntos? (A) Muitos e variados. (B) Poucos e limitados."
            ]
        },
        "Sociabilidade": {
            "descricao_polos": ["Sociável", "Não sociável"],
            "questoes": [
                "1. Você se sente à vontade e expansivo em reuniões sociais, ou prefere ficar num canto, observando? (A) À vontade e expansivo. (B) Prefiro observar.",
                "2. Você tem muitos amigos e conhecidos, ou são poucos e selecionados? (A) Muitos. (B) Poucos.",
                "3. Você gosta de trabalhar em equipe e colaborar com os outros, ou prefere trabalhar sozinho e independente? (A) Em equipe. (B) Sozinho.",
                "4. Você procura espontaneamente a companhia dos outros, ou espera que o procurem? (A) Procuro. (B) Espero que me procurem.",
                "5. Você é falante e comunicativo, ou calado e reservado? (A) Falante. (B) Calado."
            ]
        },
        "Tipo de Inteligência": {
            "descricao_polos": ["Abstrata", "Concreta"],
            "questoes": [
                "1. Você se interessa mais por ideias gerais e teorias, ou por fatos concretos e aplicações práticas? (A) Ideias e teorias. (B) Fatos e aplicações.",
                "2. Você tem mais facilidade para o raciocínio lógico e a especulação abstrata, ou para a observação e a experimentação concreta? (A) Raciocínio lógico. (B) Observação e experimentação.",
                "3. Você prefere as disciplinas teóricas (filosofia, matemática pura), ou as práticas (mecânica, comércio)? (A) Teóricas. (B) Práticas.",
                "4. Você busca compreender os princípios gerais e as leis que regem os fenômenos, ou se contenta em conhecer os fatos e suas consequências imediatas? (A) Princípios gerais. (B) Fatos e consequências.",
                "5. Você tem gosto pela argumentação sutil e pela discussão de ideias, ou prefere a exposição clara e simples dos fatos? (A) Argumentação sutil. (B) Exposição clara."
            ]
        },
        "Avidez": {
            "descricao_polos": ["Ávido", "Não ávido"],
            "questoes": [
                "1. Você deseja intensamente possuir todos os objetos materiais que lhe agradam (livros, roupas, carros, etc.)? (A) Ou se contenta facilmente com o que tem, sem desejar muito mais? (B)",
                "2. Você é ambicioso e busca sempre mais (poder, riqueza, glória, saber, etc.)? (A) Ou se satisfaz com uma situação modesta, sem grandes ambições? (B)",
                "3. Você tem um forte apetite pela vida e por todas as suas experiências (viagens, aventuras, prazeres, etc.)? (A) Ou prefere uma vida tranquila e regular, sem muitas emoções? (B)",
                "4. Você é insaciável em seus desejos e aspirações, querendo sempre mais e mais? (A) Ou seus desejos são moderados e fáceis de satisfazer? (B)",
                "5. Você sente com intensidade a necessidade de adquirir, de possuir, de dominar, de vencer? (A) Ou é desapegado dos bens materiais, do poder e do sucesso? (B)"
            ]
        },
        "Interesses Sensoriais": {
            "descricao_polos": ["Sensorial", "Intelectual"],
            "questoes": [
                "1. Você aprecia mais os prazeres concretos e materiais (comer, beber, dormir, etc.) do que os prazeres espirituais e intelectuais (ler, meditar, contemplar a beleza, etc.)? (A) Prazeres concretos. (B) Prazeres espirituais.",
                "2. Você dá grande importância ao conforto material, à boa mesa, às roupas elegantes, etc.? (A) Ou é indiferente a tudo isso, contentando-se com o necessário? (B)",
                "3. Suas escolhas e decisões são frequentemente guiadas pela busca do prazer e da satisfação imediata? (A) Ou pelos seus ideais e princípios morais? (B)",
                "4. Você é mais atraído pela beleza física e pelas aparências exteriores do que pelas qualidades morais e intelectuais? (A) Beleza física. (B) Qualidades morais.",
                "5. Você prefere as atividades que estimulam os sentidos (esportes, dança, trabalhos manuais, etc.) do que as atividades que exigem reflexão e concentração (estudo, pesquisa, etc.)? (A) Atividades sensoriais. (B) Atividades intelectuais."
            ]
        },
        "Ternura": {
            "descricao_polos": ["Terno", "Não terno"],
            "questoes": [
                "1. Você se comove facilmente com o sofrimento dos outros (doentes, pobres, animais, etc.)? (A) Ou permanece relativamente insensível diante do espetáculo da miséria alheia? (B)",
                "2. Você sente uma necessidade espontânea de proteger, de consolar, de ajudar os mais fracos e infelizes? (A) Ou pensa que cada um deve cuidar de si mesmo e resolver seus próprios problemas? (B)",
                "3. Você é sensível às manifestações de afeto e carinho (elogios, presentes, abraços, etc.)? (A) Ou as considera como sinais de fraqueza ou de sentimentalismo exagerado? (B)",
                "4. Você manifesta abertamente seus sentimentos de compaixão, de simpatia, de ternura? (A) Ou os dissimula sob uma aparência de frieza e indiferença? (B)",
                "5. Você tem um forte instinto maternal ou paternal, gostando de cuidar de crianças ou de animais? (A) Ou não sente essa necessidade, preferindo outras atividades? (B)"
            ]
        },
        "Polaridade": {
            "descricao_polos": ["Alocêntrico", "Egocêntrico"],
            "questoes": [
                "1. Você sente um prazer espontâneo em ajudar os outros, em prestar-lhes serviços, mesmo que isso lhe custe algum sacrifício? (A) Ou só o faz por dever, por interesse ou por temor de ser criticado? (B)",
                "2. Você se preocupa mais com os interesses e o bem-estar dos outros do que com os seus próprios? (A) Ou coloca seus interesses pessoais acima de tudo, não se importando muito com os demais? (B)",
                "3. Você é generoso e altruísta, gostando de dar e de repartir o que tem com os outros? (A) Ou é egoísta e calculista, procurando sempre tirar vantagens para si mesmo? (B)",
                "4. Você costuma colocar o bem comum e os interesses da coletividade acima de seus interesses particulares e de seus caprichos pessoais? (A) Ou faz o contrário, sacrificando o bem comum aos seus desejos egoístas? (B)",
                "5. Você se dedica com entusiasmo a causas sociais, humanitárias ou religiosas, que visam o bem dos outros? (A) Ou prefere cuidar de sua própria vida, sem se envolver em problemas que não lhe dizem respeito diretamente? (B)"
            ]
        }
    };

    const ALL_SECTIONS_ORDER = [
        "Emotividade", "Atividade", "Ressonância",
        ...Object.keys(FATORES_COMPLEMENTARES)
    ];

    const DESCRICOES_TEMPERAMENTOS = {
        "Apaixonado": {
            "caracteristicas": "Emotivo | Ativo | Secundário",
            "descricao": `Trata-se de um temperamento emotivo (quer dizer, impressionável ante qualquer tipo de estímulos), gosta de agir energicamente, mas pensa antes de agir, ativo (com tendência interior à ação, não importa se tiver metas definidas ou não) e secundário (quer dizer, que guarda durante muito tempo as impressões recebidas e se encontra ligado a seu passado). Por isso, ante um estímulo, o apaixonado se excita fortemente, reage energicamente, e a impressão fica na alma por muito tempo.
-	Qualidades Positivas: o apaixonado tem entendimento agudo e rigoroso, boa memória, vontade firme, concentração, constância, magnanimidade, liberalidade, decisão e eficácia. Também é muito ativo e voluntarioso, capaz de desenvolver uma atividade enérgica e prolongada, concentrada sobre um objeto preciso. É muito responsável: toma seus próprios assuntos e os que lhe encomendam com muita seriedade, e é de confiar quando promete alguma coisa. O repouso e a inação repugnam a sua natureza (é mais inclinado a agir do que a refletir). Sempre estão planejando algum projeto grande. Assim que se propôs um fim, põem-se a trabalhar, sem ter medo das dificuldades. Seu rigor lógico no pensamento, sua memória, capacidade de invenção e eficácia na execução lhe capacitam para as grandes empresas. De tudo isto segue-se que ele tenha uma notável capacidade de organização e mando. Entre eles abundam os líderes e chefes. São homens de governo.
-	Qualidades Negativas: a tenacidade de seu caráter os faz propensos à dureza, à obstinação, à insensibilidade, à ira e ao orgulho.
Geralmente são ambiciosos e têm tendência ao mando e à glória. São dominantes, gostariam que tudo se submetesse a eles. Por isso não é fácil para eles submeter-se a um superior. Também são orgulhosos e lhes custam as humilhações. Outra caraterística sua é seu amor próprio, já que geralmente não aceitam ser vencidos nem ultrapassados por ninguém.
Sua grande emotividade os predispõe à ira. As faltas próprias e alheias lhe causam grande irritação e se propõe corrigi-las com firmeza. Caso lhes resistam ou contradigam, podem tornar-se violentos e cruéis. Sua paixão, às vezes, obscurece seu juízo, motivo pelo qual suas críticas podem ser severas, e às vezes injustas.
Sua secundariedade faz com que não esqueça facilmente as injúrias recebidas. Para eles é muito difícil perdoar e reconciliar-se com seu inimigo. Se são vencidos costumam guardar ódio no coração até que chegue a hora da vingança. Outra caraterística de sua secundariedade é a imutabilidade de seus juízos, a qual às vezes chega até a teimosia.
Sua inclinação à atividade e seu ardente desejo de conseguir o que se propõem (suas obras), lhes faz, ser duros e exigentes com os que trabalham com eles, e também lutar energicamente contra tudo o que consideram um obstáculo para realizar suas obras. O apaixonado se realiza em suas obras, às quais consagra todos os seus esforços, sempre que as possa realizar segundo a sua vontade e seu modo. Quando está obrigado a realizar uma obra de um modo distinto ao dele, perde força e a realiza desanimadamente.
-	Educação: é necessário ensinar-lhe a canalizar as suas energias na busca da santidade e das virtudes necessárias a seu temperamento, as quais são:
Humildade: para vencer seu orgulho e amor próprio.
Paciência e misericórdia: com os defeitos do próximo. Deve tratar a todos com suavidade e doçura
Juízo caridoso: sempre tentar pensar bem do próximo. É o remédio contra a sua disposição às críticas.
Flexibilidade na opinião: para vencer a sua teimosia.
Desapego de suas obras: que no fundo seria desapego de fazer a sua própria vontade (de impor seu modo de fazer as coisas). Deve fazer as obras sem colocar o coração nelas. Totalmente flexíveis para mudar o modo, e até a mesma obra, se o superior o pedir.`,
            "virtudes": ""
        },
        "Colérico": {
            "caracteristicas": "Emotivo | Ativo | Primário",
            "descricao": `É emotivo (quer dizer, impressionável ante qualquer tipo de estímulos), ativo (com tendência interior a ação, não importa se tem metas definidas ou não) e primário (quer dizer, de reações imediatas mas com um rápido retorno a seu estado anterior, ou seja, fácil de acalmar- se). O colérico se excita fácil e fortemente por qualquer impressão. A reação é imediata e exterior, mas a duração é curta. A lembrança das coisas passadas não provoca tão facilmente novas emoções. Como características gerais sublinhamos a sua atividade excessiva e seu modo impulsivo. Os coléricos são pouco voltados para seu interior. Tudo o que pensam, o comentam e comunicam aos outros. São muito expressivos e propensos a expressar-se de modo exagerado. Sua primariedade e exterioridade fazem com que gostem das relações sociais e das novidades (ao contrário do sentimental e do apático que preferem a solidão e a vida rotineira). Outra nota caraterística e seu gosto pela aventura e atividades extremas.
-	Qualidades Positivas: é ativo, empreendedor e de grande iniciativa. Geralmente é otimista, não teme as dificuldades, mas confia sempre no bom êxito. Seu entusiasmo é contagioso e atraente. Sua fortaleza natural, audácia e valentia lhe capacitam para grandes empresas. Homem de ideais elevados, não se conforma com meios termos. Tem uma vontade decidida, grande talento de improvisação e qualidades de orador. Graças a sua primariedade são mais flexíveis que os apaixonados, não sendo tão teimosos como estes.
Sua atividade e primariedade dão-lhes um grande sentido prático e ótima destreza manual. Também são muito aptos para os esportes que requerem destreza física.
A sua primariedade dá-lhe uma inclinação inata a comunicar o que pensa e sente, para o qual ajuda-lhe sua notável facilidade com as palavras. É fácil e pronto à amizade e às relações sociais.
Por ser emotivo e ao mesmo tempo primário reage imediata e violentamente frente às injúrias, prorrompendo em expressões ofensivas, mas se esquece de tudo logo, sem guardar rancor de ninguém.
-	Qualidades Negativas: a sua primariedade faz com que apesar de que a sua atividade seja intensa, não tenha grande constância, nem profundidade: ele se cansa facilmente e muda de atividade sem terminar
aquilo que estava fazendo. Por esta mesma razão ele se esquece das coisas. A sua grande emotividade junto com a sua primariedade fazem com que a sua atividade seja impulsiva (sem reflexão) e improvisada (sem planificação). O qual, não poucas vezes, faz-lhes desperdiçar as suas forças, começando muitas coisas sem concluí-las ou comprometendo-se a mais tarefas do que pode realizar, tendo simultaneamente várias ocupações sem levar bem nenhuma delas. Outras vezes, a impulsividade pode levá-lo a tomar decisões arriscadas, sem prever as consequências. Enfim, por serem impulsivos, são propensos a fazer juízos apressados e superficiais, podendo cair no erro.
Outra caraterística da união da emotividade com a primariedade é a inclinação à ira e à sensualidade. Eles podem ser tão impacientes e irascíveis, que não admitam a menor falha ou contradição sem que se desate a sua cólera. Também são muito predispostos aos prazeres carnais e à vaidade (sobretudo no seu aspecto físico).
O reconhecimento de sua própria superioridade na ação, pode levá-lo ao orgulho ou à vanglória. Confia demasiado em si mesmo e sempre quer impor sua opinião aos outros. Custa-lhe reconhecer seus defeitos e facilmente critica os alheios.
-	Educação: têm que ser donos de si mesmos para poder controlar suas fortes paixões: sobretudo a ira e a sensualidade. Para isso será necessário que sejam pacientes e temperantes.
Contra a superficialidade: devem habituar-se a pensar antes de agir, aprendendo a não agir precipitadamente e a desconfiar de seus primeiros impulsos. Também devem ser profundos, tentando chegar ao fundo do assunto, antes de julgar. Devem planejar bem as suas obras antes de começá-las e seguir com fidelidade e constância o plano traçado até terminá-lo, antes de começar uma outra obra.
Devem ser humildes para não cair no orgulho ou na vanglória: evitando aparecer através de suas habilidades e destrezas.
Ser prudentes e prever as consequências de suas decisões, para que não aconteça que uma excessiva e infundada confiança no bom êxito da obra, os leve a tomar decisões arriscadas.`,
            "virtudes": ""
        },
        "Sanguíneo": {
            "caracteristicas": "Não Emotivo | Ativo | Primário",
            "descricao": `É não emotivo (quer dizer, não se impressiona facilmente), ativo (com tendência interior à ação, não importa se tem metas definidas ou não) e primário (quer dizer, de reações imediatas mas com um rápido retorno a seu estado anterior, ou seja, fácil de acalmar-se). O sanguíneo se excita facilmente, mas não fortemente. Os estímulos acendem nele o desejo, mas não a ira. A sua reação é imediata e exterior, mas é tranquila e de duração curta. A lembrança das coisas passadas não provoca tão facilmente novas emoções. Sua primariedade e exterioridade fazem com que goste das relações sociais e das novidades (ao contrário do sentimental e do apático que preferem a solidão e a vida rotineira). Sua atividade está geralmente orientada à satisfação de suas necessidades orgânicas (saúde, comodidade, prazeres sensuais) e a busca pelo bem- estar econômico e pelo êxito social (fama). A sua inteligência é viva, rápida e intuitiva, assimila facilmente, mas sem muita profundidade. Sua imaginação é ardente e tem muito sentido prático, por isso triunfa facilmente na arte, na poesia e na oratória, mas devido à sua inconstância e superficialidade poucas vezes alcança o nível dos sábios. Os sanguíneos seriam espíritos superiores se tivessem tanta profundidade como sutileza, tanta tenacidade no trabalho como facilidade nas concepções.
-	Qualidades Positivas: é afável, alegre, simpático, loquaz, serviçal, amável, atento e cortês com todos. Sociável: gosta do companheirismo e das amizades. É amigo das festas, do barulho e da animação. Dotado para a improvisação em público. Extrovertido: tudo o que pensa, comenta-o e comunica aos outros. Sincero e espontâneo (às vezes até a inconveniência).
É flexível com seus companheiros: desconhece em absoluto a teimosia e obstinação. Também é dócil e submisso a seus superiores. Quando cometeu alguma falta, facilmente se consola e renova os bons propósitos.
Ama a liberdade e é tolerante. Gosta da paz e é paciente com os defeitos alheios. Não se irrita facilmente ante as ofensas. Se for ofendido, esquece rapidamente, perdoa facilmente e não guarda rancor de ninguém.
É sensível e compassivo com as misérias do próximo. Seu bom coração cativa, exercendo uma espécie de sedução ao seu redor. Geralmente tem disposição para a música e gosto pelos esportes.
-	Qualidades Negativas: seus principais defeitos vem da sua primariedade e são três:
A superficialidade, deixa-se levar facilmente pelas aparências e por isso com frequência é superficial em seus juízos, o que provêm de sua rapidez para as concepções. Quando apenas compreendeu algo, pensa que já captou tudo em sua profundidade. Daí vem seu juízos apressados, com frequência inexatos, e até falsos. Disto se segue que muitas vezes se comporte de modo imprudente.
A inconstância, pela pouca duração de suas impressões passa rápido de um estado de ânimo a outro. São inimigos do sacrifício e da abnegação, do esforço duro e contínuo. Para perseverar em uma obra começada necessitam sempre de novos estímulos, já que por temperamento desejam mudar sempre. São desorganizados, descuidados e esquecem das coisas. Também são preguiçosos para o estudo. Não podem controlar a vista, os ouvidos, a língua e o silêncio. Facilmente se distraem na oração.
A sensualidade, enfim, tem tendência a gula e a luxúria. Sua imaginação é viva, e inclinada ao sensível; por isso prefere o mais agradável, gostoso e chamativo. Isto faz que seja propenso a gostar das vaidades do mundo: prazeres, riquezas e êxito social; e a aborrecer a disciplina, a mortificação, a pobreza e a humilhação.
-	Educação: deve incentivar as boas qualidades, e lutar contra os defeitos:
Contra a superficialidade, deve trabalhar para adquirir o hábito da reflexão e ponderação de tudo o que faça. Pensar bem antes de agir.
Contra a inconstância deve procurar ter um plano de vida, fazer bem o exame de consciência, pôr-se nas mãos do diretor espiritual e obedecer- lhe em tudo. Na oração deve lutar contra as distrações e a tendência aos consolos sensíveis.
Contra a sensualidade, deve vigiar constantemente, ser disciplinado no comer, fugir das ocasiões perigosas, guardar a vista e o recolhimento interior.`,
            "virtudes": ""
        },
        "Sentimental": {
            "caracteristicas": "Emotivo | Não Ativo | Secundário",
            "descricao": `É emotivo (quer dizer, impressionável ante qualquer tipo de estímulos), não ativo (não tende interiormente a ação) e secundário (guarda durante muito tempo as impressões recebidas e está muito ligado a seu passado). Ele é muito sensível a todo tipo de emoções ou impressões, todavia a sua reação geralmente não se exterioriza, ela se concentra no fundo da alma e ali se grava profundamente e até se acentua cada vez mais. Por exemplo, quando ele for ofendido não responde exteriormente à ofensa recebida, mas logo, quando ficar sozinho, reviverá a sua raiva e indignação, aumentando a ofensa na sua imaginação. Caso as injúrias se repitam chegará um momento em que estourará violentamente, tendo muita dificuldade para se reconciliar, pela profundidade da ferida no seu espírito. Como notas específicas indicam-se: a profundidade e a longa duração de sentimentos, e a pouca manifestação exterior dos mesmos. O sentimental é introvertido (voltado para o seu interior), sente uma grande necessidade de reflexão. Por isso preferem a vida tranquila e solitária, mais do que o barulho e a vida social. Sua secundariedade lhes faz gostar da vida rotineira não precisando de mudanças ou novidades (ao contrário do sanguíneo e do colérico).
-	Qualidades Positivas: são bondosos e honrados; incapazes de ser cruéis ou ásperos com outros, embora por ser reservados, externamente podem apáticos.
Por serem emotivos e introvertidos possuem em seu coração uma grande riqueza sentimental. Se compadecem facilmente das misérias do próximo. Sofrem muito com a frieza e com a ingratidão.
A sua secundariedade faz com que quando amam não se desprendam facilmente das afeições, porque as impressões neles se arraigam profundamente e duram muito tempo. Outra nota caraterística que provém da sua secundariedade é a sua fidelidade e constância na amizade, embora não gostam de ter muitos amigos (eles preferem um pequeno grupo de íntimos).
São naturalmente inclinados à reflexão, à solidão, à quietude, à piedade e a vida interior. Są grandes pensadores e gostam do silêncio e da tranquilidade. Tem uma inteligência aguda e profunda, amadurecem as ideias com a reflexão e a calma. Também sentem atrativos pela arte e tem aptidão para as ciências.
Na ação são comumente lentos e metódicos. Também são responsáveis em seus ofícios e cumpridores de seus deveres. São previsores e precisam que tudo esteja planejado antes de começar alguma obra.
-	Qualidades Negativas: o lado desfavorável deste temperamento é a tendência exagerada à tristeza e melancolia. A sua grande emotividade e introversão faz que quando recebem uma forte impressão, esta penetre profundamente na sua alma e lhes produza uma ferida sangrenta. Não têm o coração na mão como o sanguíneo, pelo contrário o tem muito no fundo, e ali saboreiam suas angústias. Podem sofrer muito por causa dos defeitos alheios, e podem chegar a ser susceptíveis e vulneráveis. Por uma injúria recebida se sentem desprezados e odiados. Às vezes, sua grande emotividade pode obscurecer seu juízo, o que pode levá-los a fazer juízos errados sobre o próximo.
Quando a sua emotividade se une a sua secundariedade faz com que encontrem grande dificuldade em perdoar as ofensas. Se eles odeiam, o fazem intensamente e não conseguem desafogar seus sentimentos com facilidade.
Por ser secundários e introvertidos são propensos ao juízo próprio, à teimosia e à crítica.
A sua secundariedade e inatividade os faz inseguros: o qual se manifesta na sua indecisão (voltam mil vezes sobre seus sentimentos e ações, temendo não ter feito as coisas bem ou de um modo reto); e na sua inclinação ao pessimismo (veem sempre o lado difícil das coisas, exageram as dificuldades). Por tudo isto, são propensos a ser retraídos e tímidos, predispostos à desconfiança nas suas próprias forças, ao desalento, à indecisão, aos escrúpulos, obsessão e a uma certa espécie de melancolia.
Também são apegados a seus bens, custando-lhes emprestá-los; e também à ordem de suas coisas e de sua vida, custando-lhes muito quando alguém obriga-lhes a mudar seus planos ou a ordem de suas coisas.
- Educação: contra a insegurança e a indecisão é necessário infundir-lhes uma grande confiança em Deus e em si mesmos, ou seja, nas capacidades que Deus deu-lhes para realizar grandes empresas. Quando confiam em Deus e também nas suas próprias forças, tornam-se mais seguros e confiantes. Em seguida é necessário ensinar-lhes a tomar decisões, ainda que não tenham todos os dados que eles gostariam de ter antes de decidir. Finalmente para vencer a sua timidez, devem aprender a socializar-se e a divertir-se com seus amigos.
Contra a susceptibilidade: deve-se aproveitar a sua inclinação à reflexão para fazer-lhes compreender que não é bom que sejam tão suscetíveis, que se alguém os trata mal, isto não significa que essa pessoa os odeia. Também devem encontrar um modo eficaz de exteriorizar seus sentimentos para poder desabafá-los e jamais chegar a cair na tristeza. Enfim é também importante que aprendam a perdoar as ofensas recebidas e a sarar as feridas que deixaram as ofensas passadas.
Contra o seu juízo próprio e a sua teimosia: é necessário mostrar-lhe que ele também pode errar e que por isso não deve confiar tanto em seu juízo próprio, mas sim considerar as opiniões dos outros sem pré-juízos, para ver quem é que está certo. Deste modo ele evitará a teimosia e se manterá flexível às opiniões dos outros, para estar sempre aberto à verdade.
Contra a sua disposição à crítica: deve tentar pensar sempre bem do próximo. E cuidar-se para não pensar e nem falar mal dele.
Contra o apego a seus bens e a sua ordem: devem ser indiferentes aos bens materiais e aceitar com paciência todas aquelas circunstâncias que desfazem seus planos.`,
            "virtudes": ""
        },
        "Apático": {
            "caracteristicas": "Não Emotivo | Não Ativo | Secundário",
            "descricao": `É não emotivo (não se impressiona facilmente), não ativo (não tende interiormente à ação) e secundário (guarda durante muito tempo as impressões recebidas e está ligado a seu passado).
Destacam neles a aparente ausência de paixões, a introversão e a secundariedade, caraterísticas que os fazem parecer pessoas frias e calculistas. O apático é movido por razões e não por sentimentos.
Suas caraterísticas lhes fazem preferir uma vida tranquila, sem muita atividade, com tarefas bem delimitadas e simples. A sua secundariedade fornece-lhes um ânimo constante e imperturbável, também faz com que gostem de uma vida metódica e rotineira, ao mesmo tempo que os indispõe mudanças ou novidades (ao contrário do sanguíneo e do colérico). São naturalmente inclinados à reflexão, à solidão e à quietude. Por isso não gostam da vida social. São grandes pensadores e gostam do silêncio e da tranquilidade. A sua inteligência é lenta, mas profunda, lógica e clara. Falam pouco e seu modo de falar é claro, ordenado e preciso. Na ação são comumente lentos e sistemáticos. São conservadores e respeitosos da lei, dos princípios e dos costumes. Também são responsáveis em seus ofícios e cumpridores de seus deveres, embora não costumam empreender muitas obras por iniciativa própria. São previsores e precisam de que tudo esteja planejado antes de começar alguma obra. São propensos à análise de si mesmos e de seu entorno.
-	Qualidades Positivas: é tranquilo e de ânimo constante. Permanece sossegado, discreto e sensato. É paciente, não se irrita facilmente por insultos ou fracassos. Não gosta de bater de frente com os outros. Fala pouco e seu modo de falar é claro, ordenado e preciso. É prudente e reflexivo. Também é ordenado e metódico. É dócil e obediente, se adapta progressivamente às regras do lugar onde está.
-	Qualidades Negativas: são tão tranquilos que parecem não ter interesse ou entusiasmo por nada. São muito passivos e têm pouca iniciativa. Tendem a não comprometer-se em atividades que exijam muito esforço e sacrifício.
A sua calma e lentidão podem impacientar a mais de uma pessoa. Nos casos mais agudos podem fazer-se preguiçosos, e insensíveis às reclamações dos seus superiores.
Por ser secundários e introvertidos são por uma parte propensos ao egoísmo, ao juízo próprio e à teimosia; mas por outra, inseguros em relação a seu entorno, aparecendo como retraídos, tímidos e indecisos.
São apegados a seus bens, custando-lhes emprestá-los; e também à ordem de suas coisas e de sua vida, custando-lhes quando alguém obriga- lhes a mudar seus planos ou a ordem de suas coisas.
-	Educação: contra a sua insensibilidade e passividade: é necessário acender em seus corações a chama de um ideal, que dê motivo à suas atividades. Devem ter convicções profundas e exigir-lhes esforços contínuos e ordenados para alcançar a santidade.
Contra a insegurança e a indecisão: é necessário infundir-lhes uma grande confiança em Deus e em si mesmos, ou seja, nas capacidades que Deus deu-lhes para realizar grandes empresas. Quando confiam em Deus e também nas suas próprias forças, tornam-se mais seguros e confiantes. Em seguida é necessário ensinar-lhes a tomar decisões, ainda que não tenham todos os dados que eles gostariam de ter antes de decidir. Finalmente para vencer a sua timidez, tem que aprender a socializar-se e a divertir-se com seus amigos.
Contra o seu juízo próprio e a sua teimosia: é necessário mostrar-lhe (como se faz com o sentimental) que ele também pode errar e que por isso não deve confiar tanto em seu juízo próprio, mas sim considerar as opiniões dos outros sem pré-juízos, para ver quem é que está certo. Deste modo ele evitará a teimosia e se manterá flexível às opiniões dos outros, para estar sempre aberto à verdade.
Contra o apego a seus bens e a sua ordem: devem ser indiferentes aos bens materiais e aceitar com paciência todas aquelas circunstâncias que desfazem seus planos.`,
            "virtudes": ""
        },
        "Fleumático": {
            "caracteristicas": "Não Emotivo | Ativo | Secundário",
            "descricao": `É não emotivo (quer dizer, não se impressiona facilmente), ativo (com tendência interior à ação, não importa se tem metas definidas ou não) e secundário (quer dizer, que guarda durante muito tempo as impressões recebidas). Os fleumáticos não conhecem as paixões veementes do apaixonado, nem as ardentes do colérico, nem as vivas do sanguíneo, nem as profundas do sentimental; mas como os apáticos, os fleumáticos não têm grandes paixões. Porém se diferenciam destes últimos em que os fleumáticos são mais ativos e um pouquinho mais extrovertidos. A reação de um fleumático ante um estímulo é fraca e lenta, porém constante e persistente. Eles gostam de uma vida ativa, sempre que se trate de uma atividade lenta e não muito sacrificada. A sua secundariedade faz com que sejam responsáveis em seus ofícios e cumpridores de seus deveres, embora não costumem empreender muitas obras por iniciativa própria. São conservadores e respeitosos da lei, dos princípios e dos costumes. A sua inteligência é lenta, mas profunda e clara. Geralmente eles tem boa memória, capacidade de concentração e uma lógica rigorosa. Fala pouco, e quando se comunica, o faz com medida e sem elevar a voz.
-	Qualidades Positivas: a sua pouca emotividade junto com a sua secundariedade fornecem-lhes um temperamento tranquilo e um ânimo constante. São muito pacientes, não se irritam facilmente por ofensas ou fracassos. Permanecem sossegados, discretos e sensatos.
Falam pouco e seu modo de falar é pausado, ordenado e preciso. Não gostam da vida social. Trabalham devagar, mas assiduamente, com constância e aplicação. São ordenados e sistemáticos.
Possuem um coração bondoso, porém parecem frios, pois não gostam de manifestar os seus afetos.
-	Qualidades Negativas: sua tranquilidade pode tornar-se uma espécie de apatia, despreocupando-se de tudo o que o rodeia, sem mostrar interesse ou entusiasmo por alguma coisa. Isso pode endurecer seu coração, fazendo-o insensível, frio e egoísta.
Sua calma e lentidão lhe fazem perder boas ocasiões, porque demora muito em iniciar a execução de seus planos. É possível que exagere em sua prudência e previsão até ao extremo de não começar nada por pensar
muito nas possíveis dificuldades, desperdiçando assim muitas ocasiões propícias. Isso o faz acovardar-se em mais de uma ocasião e (o que é curioso em um caráter ativo), pode tornar-lhe preguiçoso, ao fugir da ação por evitar seus possíveis perigos, ou simplesmente por defender sua solidão e tranquilidade da agitação e do trato social.
Não gosta muito da penitência e mortificação, nem dos trabalhos que implicam muito sacrifício.
-	Educação: contra a sua apatia e desinteresse: é necessário acender em seus corações a chama de um ideal, que dê motivo a suas atividades e sobretudo a suas iniciativas, já que o problema do fleumático não é a falta de atividade, mas sim a falta de empolgação.
Contra o egoísmo: deve aprender a amar e a interessar-se pelos problemas de seus amigos e companheiros.
Contra a lentidão: deve adquirir a capacidade de fazer as coisas rapidamente (para poder agir desse modo quando as circunstâncias o exijam).
Contra a timidez: deve aprender a ser mais sociável e a divertir-se com seus amigos.
Contra a sua falta de iniciativa: é necessário ensinar-lhe a não exagerar em sua prudência e previsão e lançar-se à realização de seus projetos.`,
            "virtudes": ""
        },
        "Nervoso": {
            "caracteristicas": "Emotivo | Não Ativo | Primário",
            "descricao": `É emotivo (quer dizer, impressionável ante qualquer tipo de estímulos), não ativo (quer dizer, não tende a ação) e primário (quer dizer, reage imediatamente, mas volta rapidamente para o estado anterior).
Tem como caraterística geral a sua grande variabilidade de sentimentos, sem que suas intensas emoções deixem um rastro duradouro. Isso faz com que a sua vitalidade seja turbulenta e pouco previsível. Interessa-se muito na sua vida subjetiva, rica e complexa: homem de problemas interiores, intensos gozos e sofrimentos que seguem-se uns aos outros.
-	Qualidades Positivas: tem um coração muito sensível; está inclinado à bondade e à compaixão, e é muito generoso. Atento às necessidades e gostos alheios, é espontaneamente serviçal e carinhoso quando trata com aqueles a quem admira ou sabe que gostam dele. Por seu espírito delicado tem um dom especial para o trato. A sua imaginação é vivíssima e seu engenho vivaz; tem qualidades artísticas e talento musical. A sua inteligência é mais intuitiva do que dedutiva, e mais concreta do que abstrata.
-	Qualidades Negativas: a raiz de seus defeitos é sua sensibilidade. Pode chegar a ser muito suscetível. Inclinado à vaidade e à sensualidade. Vive de impressões, dos ímpetos momentâneos, o que faz com que mude facilmente de parecer e de ocupação; pode chegar a ser escravo do momento presente. É altamente influenciável pelos amigos e o ambiente. Curioso em extremo, e muito inclinado à aventuras extravagantes. É pouco previsor e inimigo de tudo o que exija esforço e disciplina metódica (mental ou física). Sua grande excitabilidade pode tornar-lhe indisciplinado e rebelde diante daqueles que ele acha que não lhe estimam ou entendem. Sente vivamente as injúrias e dá mostras disso com alterações de gênio, embora passageiras. Gosta de aparecer e de ser admirado. Abate-se facilmente ao fracassar e faz propósitos de corrigir- se, mas logo se esquece deles. Também tende a sobrevalorizar-se a si mesmo, sublinhando mentalmente a suas boas qualidades e prestando pouca atenção a seus defeitos.
-	Educação: tem que ser dono de si mesmo para não deixar-se dominar por seus sentimentos.
Tem que aproveitar a sua emotividade para dar-se a si mesmo motivos de amor ou temor que o ajudem a realizar com fidelidade e constância aquelas atividades que planejara.
Precisam adquirir as virtudes da humildade, contra a vanglória e o gosto por aparecer; E a temperança, contra a sensualidade.`,
            "virtudes": ""
        },
        "Amorfo": {
            "caracteristicas": "Não Emotivo | Não Ativo | Primário",
            "descricao": `É não emotivo (não se impressiona facilmente), não ativo (quer dizer, não tende interiormente a ação) e primário (quer dizer, reage prontamente, mas rapidamente volta para estado anterior).
Embora não é comum esta forma temperamental, indicamos que, quando se dá, tem como característica geral o ser muito influenciável pelo ambiente.
-	Qualidades Positivas: é otimista e amável no trato. Muito sociável, embora com tendência a fugir do esforço pessoal que implicam os trabalhos comuns. É imperturbável ante o perigo.
-	Qualidades Negativas: o mais notável é a preguiça. Por isso mesmo deixa o esforço para o último momento até que as necessidades lhe obrigam a agir. Naturalmente isto lhe faz ser com frequência incumpridor e impontual. Em alguns a preguiça se disfarça de atividade, fazendo coisas que gosta, embora fuja das que deveria fazer; ou se contentando com o estritamente obrigatório. Ele é desordenado e descuidado no asseio. Às vezes é negligente no cumprimento de seu dever. Deixa-se influenciar facilmente pelo ambiente em que vive. Sua inatividade é um obstáculo para ser serviçal com o próximo, fazendo-lhe cada vez mais egocêntrico.
-	Educação: contra a sua apatia e desinteresse: é necessário acender em seus corações a chama de um ideal, que dê motivo a suas atividades.
Contra a inconstância: deve procurar ter um plano de vida, fazer bem o exame de consciência, pôr-se nas mãos do diretor espiritual e obedecer-lhe em tudo.`,
            "virtudes": ""
        }
    };


    // --- SCREEN MANAGEMENT ---
    function showScreen(screenElement) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        screenElement.classList.add('active');
    }

    function flattenQuestions() {
        allQuestionsData = []; // Clear it for fresh start
        userAnswers = {};    // Clear previous answers

        ALL_SECTIONS_ORDER.forEach(sectionKey => {
            userAnswers[sectionKey] = {}; // Initialize answer object for the section

            if (QUESTIONARIOS[sectionKey]) {
                QUESTIONARIOS[sectionKey].forEach((qText, index) => {
                    allQuestionsData.push({
                        section: sectionKey,
                        text: qText,
                        original_index: index // Store original index within its section
                    });
                });
            } else if (FATORES_COMPLEMENTARES[sectionKey] && FATORES_COMPLEMENTARES[sectionKey].questoes) {
                FATORES_COMPLEMENTARES[sectionKey].questoes.forEach((qText, index) => {
                    allQuestionsData.push({
                        section: sectionKey,
                        text: qText,
                        original_index: index // Store original index within its section
                    });
                });
            }
        });
    }

    // --- EVENT LISTENERS ---
    startButton.addEventListener('click', () => {
        userName = nameInput.value.trim();
        if (userName === "") {
            alert("Por favor, preencha seu nome completo.");
            return;
        }
        flattenQuestions(); // Initializes userAnswers and allQuestionsData (for PDF)
        currentSectionIndex = 0;

        // Reset UI elements for the start of the quiz (handled by displaySection now)
        // answerSelect.value = ""; // No global select anymore
        // nextSectionButton.style.display = 'inline-block';
        // prevSectionButton.style.display = 'none';
        // finishQuizButton.style.display = 'none';

        displaySection(currentSectionIndex);
        showScreen(questionnaireScreen);
    });

    nextSectionButton.addEventListener('click', () => {
        if (!collectAndSaveCurrentSectionAnswers()) {
             // If validation fails (e.g., not all questions answered), stop.
            return;
        }

        if (currentSectionIndex < ALL_SECTIONS_ORDER.length - 1) {
            currentSectionIndex++;
            displaySection(currentSectionIndex);
        }
        // Visibility of next/finish buttons is handled by displaySection
    });

    prevSectionButton.addEventListener('click', () => {
        // Optional: Save answers for the current section even when going back.
        // This is useful if a user makes changes and then clicks "previous" without "next".
        collectAndSaveCurrentSectionAnswers(true); // true to bypass "all answered" validation for going back

        if (currentSectionIndex > 0) {
            currentSectionIndex--;
            displaySection(currentSectionIndex);
        }
    });

    finishQuizButton.addEventListener('click', () => {
        if (!collectAndSaveCurrentSectionAnswers()) {
            // If validation fails, stop.
            return;
        }
        calculateResults();
        displayResults();
        showScreen(resultsScreen);
    });

    generatePdfButton.addEventListener('click', () => {
        // alert('Funcionalidade "Gerar PDF" a ser implementada.'); // Kept for now
        generatePDF();
    });

    completeButton.addEventListener('click', () => {
        // Reset and go back to the initial screen
        resetQuiz();
        showScreen(initialScreen);
    });


    // --- SECTION DISPLAY AND ANSWER COLLECTION LOGIC ---
    function displaySection(sectionIdx) {
        currentSectionIndex = sectionIdx; // Update global current section index
        const sectionContainer = document.getElementById('current-section-questions-container');
        sectionContainer.innerHTML = ''; // Clear previous questions

        if (sectionIdx < 0 || sectionIdx >= ALL_SECTIONS_ORDER.length) {
            console.error("Invalid section index:", sectionIdx);
            // Potentially handle error state, e.g., by going to results or first section
            return;
        }

        const sectionKey = ALL_SECTIONS_ORDER[sectionIdx];
        sectionTitle.textContent = sectionKey; // Update main section title

        let questionsInSection = [];
        if (QUESTIONARIOS[sectionKey]) {
            questionsInSection = QUESTIONARIOS[sectionKey];
        } else if (FATORES_COMPLEMENTARES[sectionKey] && FATORES_COMPLEMENTARES[sectionKey].questoes) {
            questionsInSection = FATORES_COMPLEMENTARES[sectionKey].questoes;
        }

        questionsInSection.forEach((qText, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('question-item');

            const questionP = document.createElement('p');
            questionP.classList.add('question-item-text');
            questionP.textContent = qText; // Full question text
            questionDiv.appendChild(questionP);

            const radioGroupDiv = document.createElement('div');
            radioGroupDiv.classList.add('answer-radio-group');
            radioGroupDiv.dataset.questionName = `answer_${sectionKey}_${index}`; // For easier querying

            const answerOptions = ["A", "?", "B"];
            answerOptions.forEach(optVal => {
                const radioId = `radio_${sectionKey}_${index}_${optVal}`;

                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.id = radioId;
                radioInput.name = `answer_${sectionKey}_${index}`;
                radioInput.value = optVal;
                radioInput.dataset.sectionKey = sectionKey; // Store section key
                radioInput.dataset.originalIndex = index;  // Store original index

                const label = document.createElement('label');
                label.htmlFor = radioId;
                label.textContent = optVal;

                // Restore answer if exists
                if (userAnswers[sectionKey] && userAnswers[sectionKey][index] === optVal) {
                    radioInput.checked = true;
                }

                // Append radio and label to a container for better structure if needed, or directly to radioGroupDiv
                const optionContainer = document.createElement('div'); // Optional: for individual styling of radio+label pair
                optionContainer.classList.add('radio-option-container');
                optionContainer.appendChild(radioInput);
                optionContainer.appendChild(label);
                radioGroupDiv.appendChild(optionContainer);
            });

            questionDiv.appendChild(radioGroupDiv);
            sectionContainer.appendChild(questionDiv);
        });

        // Update Progress Bar (based on sections)
        const progressBarFill = document.getElementById('progress-bar-fill');
        const progressLabelText = document.getElementById('progress-label-text');
        const totalSections = ALL_SECTIONS_ORDER.length;
        const progressPercent = totalSections > 0 ? ((sectionIdx + 1) / totalSections) * 100 : 0;

        if (progressBarFill) progressBarFill.style.width = progressPercent + '%';
        if (progressLabelText) progressLabelText.textContent = `Seção ${sectionIdx + 1} de ${totalSections}`;

        // Update Navigation Button Visibility
        prevSectionButton.style.display = (sectionIdx === 0) ? 'none' : 'inline-block';
        nextSectionButton.style.display = (sectionIdx === totalSections - 1) ? 'none' : 'inline-block';
        finishQuizButton.style.display = (sectionIdx === totalSections - 1) ? 'inline-block' : 'none';

        window.scrollTo(0, 0); // Scroll to top when new section is displayed
    }

    function collectAndSaveCurrentSectionAnswers(bypassValidation = false) {
        const sectionKey = ALL_SECTIONS_ORDER[currentSectionIndex];
        const questionItems = document.querySelectorAll('#current-section-questions-container .question-item');
        let allAnsweredInSection = true;
        let firstUnansweredRadioGroup = null;


        questionItems.forEach((questionItem, itemIndex) => {
            // Assuming each questionItem contains one radio group,
            // and originalIndex is consistent with itemIndex within the section's questions array
            const originalIndex = itemIndex; // This assumes questionItems are in the same order as questionsInSection
            const radioGroupName = `answer_${sectionKey}_${originalIndex}`;
            const selectedRadio = document.querySelector(`input[name="${radioGroupName}"]:checked`);

            let answerValue = "";
            if (selectedRadio) {
                answerValue = selectedRadio.value;
            } else {
                allAnsweredInSection = false;
                if (!firstUnansweredRadioGroup) {
                    // Find the group div to potentially scroll to or highlight
                    const groupDiv = questionItem.querySelector(`.answer-radio-group[data-question-name="${radioGroupName}"]`);
                    if (groupDiv) firstUnansweredRadioGroup = groupDiv;
                }
            }

            if (!userAnswers[sectionKey]) { // Ensure section object exists
                userAnswers[sectionKey] = {};
            }
            userAnswers[sectionKey][originalIndex] = answerValue;
        });

        if (!allAnsweredInSection && !bypassValidation) {
            alert("Por favor, responda todas as perguntas desta seção antes de prosseguir.");
            if (firstUnansweredRadioGroup) {
                // Optional: scroll to the first unanswered question
                // firstUnansweredRadioGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Or add a visual cue
                // firstUnansweredRadioGroup.closest('.question-item').style.border = '2px solid red';
            }
            return false;
        }
        return true;
    }

    // --- RESULTS LOGIC ---
    function calculateResults() {
        calculatedResults = {
            pontuacoesPrincipais: {},
            fatoresComplementares: {},
            temperamentoPrincipal: "",
            descricaoTemperamento: {},
            analiseCoerencia: {}
        };

        // 1. Calculate Principal Scores
        ["Emotividade", "Atividade", "Ressonância"].forEach(sectionKey => {
            let score = 0;
            const answersForSection = userAnswers[sectionKey] || {};
            for (let i = 0; i < (QUESTIONARIOS[sectionKey] ? QUESTIONARIOS[sectionKey].length : 0) ; i++) {
                const answer = answersForSection[i];
                if (answer === 'A') score += 1;
                else if (answer === '?') score += 0.5;
                // 'B' adds 0
            }
            calculatedResults.pontuacoesPrincipais[sectionKey] = score;
        });

        // 2. Calculate Fatores Complementares Scores
        for (const fcKey in FATORES_COMPLEMENTARES) {
            let score = 0;
            const answersForSection = userAnswers[fcKey] || {};
            const numQuestionsInFc = FATORES_COMPLEMENTARES[fcKey].questoes.length;
            for (let i = 0; i < numQuestionsInFc; i++) {
                const answer = answersForSection[i];
                let questionScore = 0;
                if (answer === 'A') questionScore = 1;
                else if (answer === '?') questionScore = 0.5;
                // 'B' adds 0
                score += (questionScore * 2); // Multiply by 2 as per Python logic
            }
            calculatedResults.fatoresComplementares[fcKey] = {
                pontuacao: score,
                resultado: "", // Will be determined next
                descricao_polos: FATORES_COMPLEMENTARES[fcKey].descricao_polos
            };
        }

        // 3. Determine Temperament
        const emotividadeScore = calculatedResults.pontuacoesPrincipais["Emotividade"];
        const atividadeScore = calculatedResults.pontuacoesPrincipais["Atividade"];
        const ressonanciaScore = calculatedResults.pontuacoesPrincipais["Ressonância"];

        const emotivo = emotividadeScore >= 5;
        const ativo = atividadeScore >= 5;
        const secundario = ressonanciaScore >= 5; // Python: S when score >= 5

        let temperamento = "Indefinido";
        if (emotivo && ativo && secundario) temperamento = "Apaixonado";
        else if (emotivo && ativo && !secundario) temperamento = "Colérico";
        else if (!emotivo && ativo && !secundario) temperamento = "Sanguíneo";
        else if (emotivo && !ativo && secundario) temperamento = "Sentimental";
        else if (!emotivo && !ativo && secundario) temperamento = "Apático";
        else if (!emotivo && ativo && secundario) temperamento = "Fleumático";
        else if (emotivo && !ativo && !secundario) temperamento = "Nervoso";
        else if (!emotivo && !ativo && !secundario) temperamento = "Amorfo";

        calculatedResults.temperamentoPrincipal = temperamento;
        calculatedResults.descricaoTemperamento = DESCRICOES_TEMPERAMENTOS[temperamento] || {};

        // 4. Detailed Fatores Complementares Analysis (determining 'resultado', 'esperado', 'explicacao')
        for (const fcKey in calculatedResults.fatoresComplementares) {
            const factor = calculatedResults.fatoresComplementares[fcKey];
            const score = factor.pontuacao;
            const polos = factor.descricao_polos; // [Polo A, Polo B]

            // Determine 'resultado' based on score (>=5 means Polo A, <5 means Polo B)
            // This matches the Python logic where if score >= 5, it's the first characteristic in `descricao_polos`.
            factor.resultado = score >= 5 ? polos[0] : polos[1];

            // Coherence Analysis (ported from Python's determinar_temperamento)
            let esperado = "Neutro"; // Default
            let explicacao = "";

            if (fcKey === "Amplitude do Campo de Consciência") {
                if (["Apaixonado", "Fleumático", "Apático"].includes(temperamento)) esperado = polos[1]; // Estreita
                else if (["Colérico", "Sanguíneo", "Nervoso", "Amorfo"].includes(temperamento)) esperado = polos[0]; // Ampla
            } else if (fcKey === "Sociabilidade") {
                if (["Colérico", "Sanguíneo", "Amorfo"].includes(temperamento)) esperado = polos[0]; // Sociável
                else if (["Apaixonado", "Sentimental", "Fleumático", "Apático", "Nervoso"].includes(temperamento)) esperado = polos[1]; // Não sociável
            } else if (fcKey === "Tipo de Inteligência") {
                 if (["Apaixonado", "Sentimental", "Fleumático", "Apático", "Nervoso"].includes(temperamento)) esperado = polos[0]; // Abstrata
                 else if (["Colérico", "Sanguíneo", "Amorfo"].includes(temperamento)) esperado = polos[1]; // Concreta
            } else if (fcKey === "Avidez") {
                if (["Apaixonado", "Colérico", "Nervoso"].includes(temperamento)) esperado = polos[0]; // Ávido
                else if (["Sanguíneo", "Sentimental", "Fleumático", "Apático", "Amorfo"].includes(temperamento)) esperado = polos[1]; // Não ávido
            } else if (fcKey === "Interesses Sensoriais") { // A=Sensorial, B=Intelectual
                if (["Sanguíneo", "Amorfo", "Nervoso"].includes(temperamento)) esperado = polos[0]; // Sensorial
                else if (["Apaixonado", "Colérico", "Sentimental", "Fleumático", "Apático"].includes(temperamento)) esperado = polos[1]; // Intelectual
            } else if (fcKey === "Ternura") {
                 if (["Sentimental", "Nervoso", "Amorfo"].includes(temperamento)) esperado = polos[0]; // Terno
                 else if (["Apaixonado", "Colérico", "Sanguíneo", "Fleumático", "Apático"].includes(temperamento)) esperado = polos[1]; // Não terno
            } else if (fcKey === "Polaridade") { // A=Alocêntrico, B=Egocêntrico
                if (["Apaixonado", "Colérico", "Sanguíneo", "Sentimental"].includes(temperamento)) esperado = polos[0]; // Alocêntrico
                else if (["Fleumático", "Apático", "Nervoso", "Amorfo"].includes(temperamento)) esperado = polos[1]; // Egocêntrico
            }

            if (factor.resultado === esperado) {
                explicacao = "Este resultado é coerente com o temperamento.";
            } else if (esperado === "Neutro") {
                explicacao = "Este fator é considerado neutro para este temperamento.";
            } else {
                explicacao = `Este resultado (${factor.resultado}) pode indicar uma variação ou adaptação do temperamento base (${temperamento}), pois o esperado seria ${esperado}.`;
            }
            factor.esperado = esperado;
            factor.explicacao = explicacao;
        }
        console.log("Calculated Results:", calculatedResults);
    }


    function displayResults() {
        resultNome.textContent = userName;
        const now = new Date();
        resultData.textContent = `${now.toLocaleDateString('pt-BR')} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

        resultTemperamentoTipo.textContent = `${calculatedResults.temperamentoPrincipal} (${calculatedResults.descricaoTemperamento.caracteristicas || ''})`;

        scoreEmotividade.textContent = `${calculatedResults.pontuacoesPrincipais.Emotividade}/10`;
        scoreAtividade.textContent = `${calculatedResults.pontuacoesPrincipais.Atividade}/10`;
        scoreRessonancia.textContent = `${calculatedResults.pontuacoesPrincipais.Ressonância}/10 (Quanto maior, mais Secundário)`;

        fatoresComplementaresResults.innerHTML = ""; // Clear previous
        for (const fcKey in calculatedResults.fatoresComplementares) {
            const factor = calculatedResults.fatoresComplementares[fcKey];
            const div = document.createElement('div');
            div.innerHTML = `
                <strong>${fcKey}:</strong> ${factor.resultado} (Pontuação: ${factor.pontuacao.toFixed(1)}/10)
                <br><small><em>Esperado para ${calculatedResults.temperamentoPrincipal}: ${factor.esperado}. ${factor.explicacao}</em></small>
            `;
            fatoresComplementaresResults.appendChild(div);
        }
    }

    // --- PDF GENERATION ---
    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let yPos = 22;
        const lineSpacing = 7;
        const indent = 14;
        const indentSub = 20;

        doc.setFontSize(18);
        doc.text("Resultados do Questionário de Temperamentos", indent, yPos);
        yPos += lineSpacing * 2;

        doc.setFontSize(12);
        doc.text(`Nome: ${userName}`, indent, yPos);
        yPos += lineSpacing;
        doc.text(`Data: ${resultData.textContent}`, indent, yPos);
        yPos += lineSpacing * 0.7; // Adjusted spacing before attribution

        // Add Attribution Text to PDF
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80); // Subtle gray

        const attributionText = "Este questionário foi baseado no livro 'O Conhecimento de Si Mesmo - Os 8 Temperamentos'. Autor: Padre Antonio Gonzáles, IVE (Instituto do Verbo Encarnado).";
        const splitAttributionText = doc.splitTextToSize(attributionText, 180); // Adjust width as needed (page width - 2*indent)
        doc.text(splitAttributionText, indent, yPos);

        yPos += (splitAttributionText.length * 4) + lineSpacing * 0.8; // Adjust yPos based on lines used (4 is approx line height for 9pt font)

        doc.setTextColor(0, 0, 0); // Reset text color to black
        // Font size for next block will be set by its own styling logic

        doc.setFontSize(14); // Reset for "Temperamento Principal" heading
        doc.text("Temperamento Principal", indent, yPos);
        yPos += lineSpacing;
        doc.setFontSize(12);
        doc.text(`${calculatedResults.temperamentoPrincipal} (${calculatedResults.descricaoTemperamento.caracteristicas || ''})`, indentSub, yPos);
        yPos += lineSpacing;

        if(calculatedResults.descricaoTemperamento.descricao) {
            const descLines = doc.splitTextToSize(calculatedResults.descricaoTemperamento.descricao, 170);
            doc.text(descLines, indentSub, yPos);
            yPos += descLines.length * lineSpacing * 0.7; // Adjust spacing for multiline
        }
         yPos += lineSpacing * 0.5; // Gap

        if(calculatedResults.descricaoTemperamento.virtudes) {
            doc.setFontSize(12);
            doc.text("Virtudes/Potencialidades:", indentSub, yPos);
            yPos += lineSpacing;
            const virtLines = doc.splitTextToSize(calculatedResults.descricaoTemperamento.virtudes, 160);
            doc.setFontSize(10);
            doc.text(virtLines, indentSub + 5, yPos);
            yPos += virtLines.length * lineSpacing * 0.8;
        }
        yPos += lineSpacing;


        doc.setFontSize(14);
        doc.text("Pontuações Principais", indent, yPos);
        yPos += lineSpacing;
        doc.setFontSize(12);
        doc.text(`Emotividade: ${calculatedResults.pontuacoesPrincipais.Emotividade}/10`, indentSub, yPos);
        yPos += lineSpacing;
        doc.text(`Atividade: ${calculatedResults.pontuacoesPrincipais.Atividade}/10`, indentSub, yPos);
        yPos += lineSpacing;
        doc.text(`Ressonância: ${calculatedResults.pontuacoesPrincipais.Ressonância}/10 (>=5 indica Secundário)`, indentSub, yPos);
        yPos += lineSpacing * 1.5;

        doc.setFontSize(14);
        doc.text("Análise dos Fatores Complementares", indent, yPos);
        yPos += lineSpacing;
        doc.setFontSize(10);

        for (const fcKey in calculatedResults.fatoresComplementares) {
            if (yPos > 265) { // Check for page break (give a bit more room)
                doc.addPage();
                yPos = 20;
            }
            const factor = calculatedResults.fatoresComplementares[fcKey];
            doc.setFontSize(11);
            doc.text(`${fcKey}: ${factor.resultado} (Pontuação: ${factor.pontuacao.toFixed(1)}/10)`, indentSub, yPos);
            yPos += lineSpacing * 0.8;

            doc.setFontSize(9);
            const explLines = doc.splitTextToSize(`Esperado para ${calculatedResults.temperamentoPrincipal}: ${factor.esperado}. ${factor.explicacao}`, 150); // Max width for explanation
            doc.text(explLines, indentSub + 5, yPos);
            yPos += explLines.length * (lineSpacing * 0.7);
            yPos += lineSpacing * 0.5; // Small gap between factors
        }

        // --- TABLES OF ANSWERS ---
        let questionCounter = 1;
        const tableStartYPos = 20;
        const pageMaxY = 280; // Max Y position before adding a new page
        const colWidths = { num: 15, question: 125, answer: 30 }; // Approximate widths
        const rowPadding = 2;
        const questionTextLineHeight = 4; // Smaller line height for wrapped question text

        function drawTableHeader(doc, yPosition) {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text("Nº", indent, yPosition);
            doc.text("Pergunta", indent + colWidths.num, yPosition);
            doc.text("Resposta", indent + colWidths.num + colWidths.question + 5, yPosition);
            doc.setFont(undefined, 'normal');
            return yPosition + lineSpacing * 0.8;
        }

        function drawTableRow(doc, num, questionText, answerGiven, yPosition) {
            let currentY = yPosition;
            doc.setFontSize(9);

            // Answer column first to determine its height (usually single line)
            doc.text(String(answerGiven), indent + colWidths.num + colWidths.question + 7, currentY);

            // Question Number
            doc.text(String(num), indent + 2, currentY);

            // Question Text (with wrapping)
            // Truncate question if it's extremely long before splitting, 90 chars + ...
            const maxQuestionTextLength = 90;
            let qTextForTable = questionText;
            if (qTextForTable.length > maxQuestionTextLength) {
                qTextForTable = qTextForTable.substring(0, maxQuestionTextLength) + "...";
            }
            // Remove (A)... (B)... parts for cleaner table display if they exist
            qTextForTable = qTextForTable.replace(/\s*\([A-Z]\).*$/, "");


            const questionLines = doc.splitTextToSize(qTextForTable, colWidths.question);
            doc.text(questionLines, indent + colWidths.num, currentY);

            const rowHeight = Math.max(lineSpacing * 0.6, questionLines.length * questionTextLineHeight);
            currentY += rowHeight + rowPadding;
            return currentY;
        }

        // --- Main Questionnaire Answers Table ---
        doc.addPage();
        yPos = tableStartYPos;
        doc.setFontSize(14);
        doc.text("Respostas do Questionário Principal", indent, yPos);
        yPos += lineSpacing * 1.5;
        yPos = drawTableHeader(doc, yPos);

        ["Emotividade", "Atividade", "Ressonância"].forEach(sectionKey => {
            if (yPos > pageMaxY - 20) { // Check before section header
                doc.addPage();
                yPos = tableStartYPos;
                yPos = drawTableHeader(doc, yPos);
            }
            doc.setFontSize(11);
            doc.setFont(undefined, 'bolditalic');
            doc.text(`Seção: ${sectionKey}`, indent, yPos);
            yPos += lineSpacing * 0.8;
            doc.setFont(undefined, 'normal');

            const questionsInSection = QUESTIONARIOS[sectionKey];
            questionsInSection.forEach((qText, index) => {
                if (yPos > pageMaxY) {
                    doc.addPage();
                    yPos = tableStartYPos;
                    yPos = drawTableHeader(doc, yPos);
                     // Re-draw section header if page breaks mid-section
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bolditalic');
                    doc.text(`Seção: ${sectionKey} (continuação)`, indent, yPos);
                    yPos += lineSpacing * 0.8;
                    doc.setFont(undefined, 'normal');
                }
                const answer = userAnswers[sectionKey] ? (userAnswers[sectionKey][index] || "-") : "-";
                yPos = drawTableRow(doc, questionCounter++, qText, answer, yPos);
            });
            yPos += lineSpacing * 0.5; // Gap after section
        });

        // --- Complementary Factors Answers Table ---
        doc.addPage();
        yPos = tableStartYPos;
        doc.setFontSize(14);
        doc.text("Respostas dos Fatores Complementares", indent, yPos);
        yPos += lineSpacing * 1.5;
        yPos = drawTableHeader(doc, yPos);
        let fcQuestionCounter = 1; // Separate counter for FC questions if preferred, or use global questionCounter

        for (const fcKey in FATORES_COMPLEMENTARES) {
            if (yPos > pageMaxY - 20) { // Check before section header
                doc.addPage();
                yPos = tableStartYPos;
                yPos = drawTableHeader(doc, yPos);
            }
            doc.setFontSize(11);
            doc.setFont(undefined, 'bolditalic');
            doc.text(`Fator: ${fcKey}`, indent, yPos);
            yPos += lineSpacing * 0.8;
            doc.setFont(undefined, 'normal');

            const questionsInSection = FATORES_COMPLEMENTARES[fcKey].questoes;
            questionsInSection.forEach((qText, index) => {
                if (yPos > pageMaxY) {
                    doc.addPage();
                    yPos = tableStartYPos;
                    yPos = drawTableHeader(doc, yPos);
                    // Re-draw section header if page breaks mid-section
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bolditalic');
                    doc.text(`Fator: ${fcKey} (continuação)`, indent, yPos);
                    yPos += lineSpacing * 0.8;
                    doc.setFont(undefined, 'normal');
                }
                const answer = userAnswers[fcKey] ? (userAnswers[fcKey][index] || "-") : "-";
                yPos = drawTableRow(doc, questionCounter++, qText, answer, yPos); // Using global counter
            });
            yPos += lineSpacing * 0.5; // Gap after section
        }

        // --- Section IV: Detailed Temperament Description ---
        doc.addPage();
        yPos = 20; // Reset yPos for new page, using a common top margin.

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text("IV. DESCRIÇÃO DETALHADA DO TEMPERAMENTO", indent, yPos);
        yPos += lineSpacing * 2;
        doc.setFont(undefined, 'normal');

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(calculatedResults.temperamentoPrincipal, indent, yPos);
        yPos += lineSpacing;

        doc.setFontSize(11);
        doc.setFont(undefined, 'italic');
        doc.text(calculatedResults.descricaoTemperamento.caracteristicas, indent, yPos);
        yPos += lineSpacing * 1.5;
        doc.setFont(undefined, 'normal'); // Reset italic

        doc.setFontSize(10); // Set font size for the detailed description
        const fullDesc = calculatedResults.descricaoTemperamento.descricao;
        if (fullDesc) {
            const naturalLines = fullDesc.split('\n');

            for (const natLine of naturalLines) {
                let currentLineIndent = indent;
                let textToPrint = natLine;

                if (natLine.trim().startsWith("-") || natLine.trim().startsWith("•")) { // Handle common bullet point chars
                    currentLineIndent = indent + 5;
                    // Optional: remove bullet character if it's consistently part of the string
                    // textToPrint = natLine.trim().substring(1).trim();
                } else if (natLine.trim() === "") {
                    if (yPos > pageMaxY - (lineSpacing * 0.5)) { // Check if space for empty line causes overflow
                         doc.addPage(); yPos = 20;
                    } else {
                        yPos += lineSpacing * 0.5; // Add smaller space for an empty line (paragraph break)
                    }
                    continue;
                }

                const wrappedLines = doc.splitTextToSize(textToPrint, 190 - currentLineIndent - 10); // Max width, considering indent and right margin

                for (const line of wrappedLines) {
                    if (yPos > pageMaxY - 5) { // Check space for each wrapped line (approx height of 10pt font)
                        doc.addPage();
                        yPos = 20;
                        // Re-apply indent if it was a continuation of an indented line
                        // This is tricky if a bullet point wraps over many lines and pages.
                        // For simplicity, new pages restart with standard indent or specific bullet indent if the new line starts with it.
                        currentLineIndent = indent;
                        if (textToPrint.trim().startsWith("-") || textToPrint.trim().startsWith("•")) {
                             currentLineIndent = indent + 5;
                        }
                    }
                    doc.text(line, currentLineIndent, yPos);
                    yPos += 4.5; // Line height for 10pt font (approx 4-5 points)
                }
            }
        }
        // End of Detailed Temperament Description

        doc.save(`Resultados_Temperamentos_${userName.replace(/\s+/g, '_')}.pdf`);
    }


    // --- QUIZ RESET ---
    function resetQuiz() {
        currentQuestionIndex = 0;
        userAnswers = {};
        calculatedResults = {};
        userName = "";
        nameInput.value = "";
        answerSelect.value = "";

        resultNome.textContent = "";
        resultData.textContent = "";
        resultTemperamentoTipo.textContent = "";
        scoreEmotividade.textContent = "";
        scoreAtividade.textContent = "";
        scoreRessonancia.textContent = "";
        fatoresComplementaresResults.innerHTML = "";
        // Reset button visibility (handled by displaySection on quiz restart)
        // nextSectionButton.style.display = 'inline-block'; // Not needed, displaySection handles
        // prevSectionButton.style.display = 'none'; // Not needed, displaySection handles
        // finishQuizButton.style.display = 'none'; // Not needed, displaySection handles
        allQuestionsData = []; // Clear flattened questions (used for PDF)
        currentSectionIndex = 0; // Reset current section index

        // Reset progress bar
       const progressBarFill = document.getElementById('progress-bar-fill');
       const progressLabelText = document.getElementById('progress-label-text');
       if (progressBarFill) {
           progressBarFill.style.width = '0%';
           // progressBarFill.textContent = ''; // Clear text if you added any
       }
       if (progressLabelText) {
           progressLabelText.textContent = '';
       }
    }

    // --- INITIALIZATION ---
    showScreen(initialScreen); // Show initial screen by default
});

// Old loadQuestions() function should be removed if present (it was at the end of the file)
