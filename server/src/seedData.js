// Contenu de démonstration (original, niveau Terminale). À remplacer ou compléter par les enseignants.
const L = String.raw;

export const chapitres = [
  {
    matiere: 'Mathématiques', ordre: 1, titre: 'Suites numériques',
    resume: 'Suites arithmétiques, géométriques, récurrentes ; sens de variation et convergence.',
    contenu: L`\section{L'essentiel}
\textbf{Suite arithmétique} de raison $r$ : $u_{n+1} = u_n + r$, donc $u_n = u_0 + nr$.
Somme : $u_0 + u_1 + \dots + u_n = (n+1)\,\dfrac{u_0 + u_n}{2}$.

\textbf{Suite géométrique} de raison $q$ : $u_{n+1} = q\,u_n$, donc $u_n = u_0\,q^n$.
Si $q \neq 1$ : $1 + q + \dots + q^n = \dfrac{1 - q^{n+1}}{1 - q}$.

\section{Suites arithmético-géométriques}
Pour $u_{n+1} = a\,u_n + b$ avec $a \neq 1$, on cherche le point fixe $\ell = a\ell + b$ puis on pose $v_n = u_n - \ell$ : la suite $(v_n)$ est géométrique de raison $a$.

\section{Convergence}
Toute suite croissante et majorée converge. Si $|q| < 1$ alors $q^n \to 0$.`,
  },
  {
    matiere: 'Mathématiques', ordre: 2, titre: 'Limites et continuité',
    resume: 'Limites usuelles, formes indéterminées, théorème des valeurs intermédiaires.',
    contenu: L`\section{L'essentiel}
En $+\infty$, une fonction rationnelle a la même limite que le quotient de ses termes de plus haut degré.

\textbf{Limites à connaître} : $\lim_{x \to 0} \dfrac{\sin x}{x} = 1$, $\lim_{x \to +\infty} \dfrac{\ln x}{x} = 0$, $\lim_{x \to +\infty} \dfrac{e^x}{x} = +\infty$.

\section{Formes indéterminées}
Pour une différence de racines, on multiplie par l'expression conjuguée.

\section{Valeurs intermédiaires}
Si $f$ est continue sur $[a;b]$ et si $k$ est compris entre $f(a)$ et $f(b)$, l'équation $f(x) = k$ admet au moins une solution dans $[a;b]$. Si de plus $f$ est strictement monotone, cette solution est unique.`,
  },
  {
    matiere: 'Mathématiques', ordre: 3, titre: 'Dérivation',
    resume: 'Dérivées usuelles, sens de variation, extremums, tangentes.',
    contenu: L`\section{Dérivées usuelles}
\begin{itemize}
\item $(x^n)' = n\,x^{n-1}$
\item $(e^x)' = e^x$ et $(\ln x)' = \dfrac{1}{x}$
\item $(uv)' = u'v + uv'$ et $\left(\dfrac{u}{v}\right)' = \dfrac{u'v - uv'}{v^2}$
\end{itemize}

\section{Étudier une fonction}
On calcule $f'(x)$, on étudie son signe, puis on dresse le tableau de variation. Si $f'$ s'annule en changeant de signe en $a$, alors $f$ admet un extremum local en $a$.

\section{Tangente}
Au point d'abscisse $a$ : $y = f'(a)(x - a) + f(a)$.`,
  },
  {
    matiere: 'Mathématiques', ordre: 4, titre: 'Calcul intégral',
    resume: 'Primitives, intégrale sur un segment, intégration par parties.',
    contenu: L`\section{L'essentiel}
Si $F$ est une primitive de $f$ sur $[a;b]$ :
\[ \int_a^b f(x)\,dx = F(b) - F(a). \]

\section{Intégration par parties}
\[ \int_a^b u(x)\,v'(x)\,dx = \big[u(x)\,v(x)\big]_a^b - \int_a^b u'(x)\,v(x)\,dx. \]
On choisit pour $u$ la fonction qui se simplifie en dérivant (un polynôme, $\ln x$).`,
  },
  {
    matiere: 'Mathématiques', ordre: 5, titre: 'Probabilités',
    resume: 'Dénombrement, variables aléatoires, loi binomiale.',
    contenu: L`\section{L'essentiel}
En situation d'équiprobabilité : $P(A) = \dfrac{\text{nombre de cas favorables}}{\text{nombre de cas possibles}}$.

\section{Loi binomiale}
Si $X$ compte les succès dans $n$ épreuves indépendantes de probabilité de succès $p$ :
\[ P(X = k) = \binom{n}{k}\,p^k\,(1-p)^{n-k}, \qquad E(X) = np. \]`,
  },
  {
    matiere: 'Physique-Chimie', ordre: 1, titre: 'Réactions acido-basiques',
    resume: 'pH, acides forts et faibles, dosages.',
    contenu: L`\section{L'essentiel}
$\text{pH} = -\log\,[\text{H}_3\text{O}^+]$. Pour un acide fort de concentration $c$ : $\text{pH} = -\log c$.

\section{Dosage}
À l'équivalence, les réactifs sont dans les proportions de l'équation. Pour un monoacide dosé par une monobase :
\[ c_a\,V_a = c_b\,V_{b,\text{éq}}. \]`,
  },
  {
    matiere: 'Philosophie', ordre: 1, titre: 'La liberté',
    resume: 'Liberté et contrainte, libre arbitre et déterminisme, liberté et loi.',
    contenu: L`\section{Repères}
\begin{itemize}
\item \textbf{Liberté d'action} : absence de contrainte extérieure.
\item \textbf{Libre arbitre} : pouvoir de choisir sans être déterminé.
\item \textbf{Autonomie} : obéir à la loi que l'on se donne à soi-même.
\end{itemize}

\section{Méthode}
En dissertation, on définit les termes du sujet, on fait apparaître la tension qu'il contient, puis on progresse en trois temps vers une réponse nuancée.`,
  },
];

// [titre du chapitre, exercice]
export const exercices = [
  ['Suites numériques', {
    titre: 'Une suite récurrente', niveau: 'Intermédiaire', duree: 20,
    enonce: L`On considère la suite numérique $(u_n)$ définie par :
\[ u_0 = 1 \quad\text{et}\quad u_{n+1} = 2u_n + 1 \quad (n \geq 0). \]
\begin{enumerate}
\item Calculer les trois premiers termes.
\item Montrer que $v_n = u_n + 1$ est géométrique.
\item En déduire l'expression de $u_n$.
\end{enumerate}`,
    indice: L`Exprime $v_{n+1}$ en fonction de $u_n$, puis factorise par 2.`,
    correction: L`\textbf{1.} $u_0 = 1$, $u_1 = 3$, $u_2 = 7$.

\textbf{2.} $v_{n+1} = u_{n+1} + 1 = 2u_n + 2 = 2(u_n + 1) = 2v_n$ : la suite $(v_n)$ est géométrique de raison 2 et de premier terme $v_0 = 2$.

\textbf{3.} $v_n = 2 \times 2^n = 2^{n+1}$, d'où $u_n = 2^{n+1} - 1$.`,
  }],
  ['Suites numériques', {
    titre: 'Somme de termes consécutifs', niveau: 'Facile', duree: 10,
    enonce: L`Soit $(u_n)$ la suite définie par $u_n = 3n + 2$.
\begin{enumerate}
\item Justifier que $(u_n)$ est arithmétique.
\item Calculer $S = u_0 + u_1 + \dots + u_{10}$.
\end{enumerate}`,
    indice: L`La somme compte 11 termes.`,
    correction: L`\textbf{1.} $u_{n+1} - u_n = 3$ : suite arithmétique de raison 3.

\textbf{2.} $u_0 = 2$ et $u_{10} = 32$, donc $S = 11 \times \dfrac{2 + 32}{2} = 187$.`,
  }],
  ['Suites numériques', {
    titre: "Convergence d'une suite", niveau: 'Difficile', duree: 30,
    enonce: L`On pose $u_0 = 0$ et $u_{n+1} = \sqrt{u_n + 2}$.
\begin{enumerate}
\item Montrer par récurrence que $0 \leq u_n \leq 2$ pour tout $n$.
\item Montrer que $(u_n)$ est croissante.
\item En déduire que $(u_n)$ converge et déterminer sa limite.
\end{enumerate}`,
    indice: L`Pour la limite $\ell$, passe à la limite dans la relation de récurrence : $\ell = \sqrt{\ell + 2}$.`,
    correction: L`\textbf{1.} Vrai pour $n = 0$. Si $0 \leq u_n \leq 2$ alors $2 \leq u_n + 2 \leq 4$, donc $0 \leq \sqrt{2} \leq u_{n+1} \leq 2$.

\textbf{2.} $u_{n+1}^2 - u_n^2 = -u_n^2 + u_n + 2 = (2 - u_n)(1 + u_n) \geq 0$ et les termes sont positifs, donc $u_{n+1} \geq u_n$.

\textbf{3.} Croissante et majorée par 2, la suite converge vers $\ell \in [0;2]$ avec $\ell^2 = \ell + 2$, soit $\ell = 2$.`,
  }],
  ['Limites et continuité', {
    titre: "Limite d'une fonction rationnelle", niveau: 'Facile', duree: 10,
    enonce: L`Déterminer $\displaystyle\lim_{x \to +\infty} \frac{3x^2 - x + 1}{x^2 + 4}$.`,
    indice: L`Factorise par $x^2$ au numérateur et au dénominateur.`,
    correction: L`$\dfrac{3x^2 - x + 1}{x^2 + 4} = \dfrac{3 - \frac{1}{x} + \frac{1}{x^2}}{1 + \frac{4}{x^2}} \to 3$.`,
  }],
  ['Limites et continuité', {
    titre: 'Deux formes indéterminées', niveau: 'Intermédiaire', duree: 20,
    enonce: L`Calculer :
\begin{enumerate}
\item $\displaystyle\lim_{x \to 0} \frac{\sin(3x)}{x}$
\item $\displaystyle\lim_{x \to +\infty} \left(\sqrt{x^2 + x} - x\right)$
\end{enumerate}`,
    indice: L`Pour la seconde, multiplie par l'expression conjuguée.`,
    correction: L`\textbf{1.} $\dfrac{\sin(3x)}{x} = 3 \times \dfrac{\sin(3x)}{3x} \to 3$.

\textbf{2.} $\sqrt{x^2 + x} - x = \dfrac{x}{\sqrt{x^2 + x} + x} = \dfrac{1}{\sqrt{1 + \frac{1}{x}} + 1} \to \dfrac{1}{2}$.`,
  }],
  ['Dérivation', {
    titre: "Étude d'une fonction", niveau: 'Facile', duree: 15,
    enonce: L`On considère la fonction $f$ définie sur $\mathbb{R}$ par $f(x) = x^2 - 4x + 3$.
\begin{enumerate}
\item Calculer $f'(x)$.
\item Dresser le tableau de variation de $f$.
\item Déterminer l'équation de la tangente au point d'abscisse 0.
\end{enumerate}`,
    indice: L`Le minimum est atteint là où $f'$ s'annule.`,
    correction: L`\textbf{1.} $f'(x) = 2x - 4$.

\textbf{2.} $f'(x) < 0$ si $x < 2$ et $f'(x) > 0$ si $x > 2$ : $f$ décroît puis croît, avec un minimum $f(2) = 4 - 8 + 3 = -1$.

\textbf{3.} $f(0) = 3$ et $f'(0) = -4$ : $y = -4x + 3$.`,
  }],
  ['Dérivation', {
    titre: 'Un maximum avec une exponentielle', niveau: 'Intermédiaire', duree: 20,
    enonce: L`Soit $f(x) = x\,e^{-x}$ sur $\mathbb{R}$. Étudier les variations de $f$ et préciser son maximum.`,
    indice: L`Utilise la dérivée d'un produit, puis factorise par $e^{-x}$.`,
    correction: L`$f'(x) = e^{-x} - x\,e^{-x} = (1 - x)\,e^{-x}$, du signe de $1 - x$. La fonction croît sur $]-\infty;1]$ puis décroît ; son maximum vaut $f(1) = \dfrac{1}{e}$.`,
  }],
  ['Calcul intégral', {
    titre: 'Une première intégrale', niveau: 'Facile', duree: 10,
    enonce: L`Calculer $I = \displaystyle\int_0^1 (2x + 1)\,dx$.`,
    indice: L`Une primitive de $2x + 1$ est $x^2 + x$.`,
    correction: L`$I = \big[x^2 + x\big]_0^1 = 2$.`,
  }],
  ['Calcul intégral', {
    titre: 'Intégration par parties', niveau: 'Intermédiaire', duree: 20,
    enonce: L`Calculer $J = \displaystyle\int_1^e \ln x\,dx$.`,
    indice: L`Pose $u(x) = \ln x$ et $v'(x) = 1$.`,
    correction: L`Avec $u = \ln x$ et $v = x$ : $J = \big[x \ln x\big]_1^e - \displaystyle\int_1^e 1\,dx = e - (e - 1) = 1$.`,
  }],
  ['Probabilités', {
    titre: 'Somme de deux dés', niveau: 'Facile', duree: 10,
    enonce: L`On lance deux fois un dé équilibré à six faces. Quelle est la probabilité que la somme des deux résultats soit égale à 7 ?`,
    indice: L`Il y a 36 issues équiprobables : compte les couples favorables.`,
    correction: L`Les couples $(1,6)$, $(2,5)$, $(3,4)$, $(4,3)$, $(5,2)$, $(6,1)$ conviennent : $P = \dfrac{6}{36} = \dfrac{1}{6}$.`,
  }],
  ['Probabilités', {
    titre: 'Loi binomiale', niveau: 'Intermédiaire', duree: 15,
    enonce: L`Une variable aléatoire $X$ suit la loi binomiale de paramètres $n = 5$ et $p = 0{,}3$.
\begin{enumerate}
\item Calculer $P(X = 2)$.
\item Calculer $E(X)$.
\end{enumerate}`,
    indice: L`$\binom{5}{2} = 10$.`,
    correction: L`\textbf{1.} $P(X = 2) = 10 \times 0{,}3^2 \times 0{,}7^3 = 0{,}3087$.

\textbf{2.} $E(X) = 5 \times 0{,}3 = 1{,}5$.`,
  }],
  ['Réactions acido-basiques', {
    titre: "pH d'un acide fort", niveau: 'Facile', duree: 10,
    enonce: L`Une solution d'acide chlorhydrique a pour concentration $c = 2{,}0 \times 10^{-3}\ \text{mol/L}$. Calculer son pH.`,
    indice: L`L'acide chlorhydrique est un acide fort : $[\text{H}_3\text{O}^+] = c$.`,
    correction: L`$\text{pH} = -\log(2{,}0 \times 10^{-3}) \approx 2{,}7$.`,
  }],
  ['Réactions acido-basiques', {
    titre: "Dosage d'un vinaigre", niveau: 'Intermédiaire', duree: 20,
    enonce: L`On dose $V_a = 10{,}0\ \text{mL}$ d'une solution d'acide éthanoïque par une solution de soude de concentration $c_b = 0{,}10\ \text{mol/L}$. L'équivalence est obtenue pour $V_{b,\text{éq}} = 12{,}0\ \text{mL}$. Déterminer la concentration $c_a$ de l'acide.`,
    indice: L`À l'équivalence : $c_a V_a = c_b V_{b,\text{éq}}$.`,
    correction: L`$c_a = \dfrac{0{,}10 \times 12{,}0}{10{,}0} = 0{,}12\ \text{mol/L}$.`,
  }],
  ['La liberté', {
    titre: 'Être libre, est-ce faire ce que l\'on veut ?', niveau: 'Intermédiaire', duree: 45,
    enonce: 'Sujet de dissertation : « Être libre, est-ce faire ce que l\'on veut ? »\n\nProposer une problématique et un plan détaillé en trois parties.',
    indice: 'Distingue « ce que je désire sur le moment » de « ce que je veux vraiment ».',
    correction: L`\textbf{Problématique.} La liberté se réduit-elle à l'absence d'obstacles à nos désirs, ou suppose-t-elle une maîtrise de soi et des règles ?

\textbf{I.} En première approche, être libre, c'est agir sans contrainte.

\textbf{II.} Mais suivre tous ses désirs peut être une forme de servitude : on subit ses impulsions.

\textbf{III.} La liberté véritable est l'autonomie : vouloir de façon réfléchie, dans le cadre de lois qui garantissent la liberté de tous.`,
  }],
];

export const annales = [
  {
    matiere: 'Mathématiques', serie: 'C', titre: 'Baccalauréat blanc · Mathématiques n° 1', dureeMin: 180,
    exercices: [
      {
        titre: 'Suite arithmético-géométrique', theme: 'Suites', points: 5,
        enonce: L`Soit $(u_n)$ définie par $u_0 = 2$ et $u_{n+1} = \dfrac{1}{2}u_n + 3$.
\begin{enumerate}
\item Calculer $u_1$ et $u_2$.
\item Montrer que $v_n = u_n - 6$ est géométrique.
\item Exprimer $u_n$ en fonction de $n$ et donner sa limite.
\end{enumerate}`,
        corrige: L`$u_1 = 4$, $u_2 = 5$. $v_{n+1} = \frac{1}{2}u_n - 3 = \frac{1}{2}v_n$, avec $v_0 = -4$. Donc $u_n = 6 - 4\left(\frac{1}{2}\right)^n$ et $\lim u_n = 6$.`,
      },
      {
        titre: 'Calcul intégral', theme: 'Calcul intégral', points: 5,
        enonce: L`\begin{enumerate}
\item Calculer $I = \displaystyle\int_0^1 (2x + 1)\,dx$.
\item À l'aide d'une intégration par parties, calculer $J = \displaystyle\int_0^1 x\,e^x\,dx$.
\end{enumerate}`,
        corrige: L`$I = [x^2 + x]_0^1 = 2$. Avec $u = x$, $v' = e^x$ : $J = [x e^x]_0^1 - \int_0^1 e^x\,dx = e - (e - 1) = 1$.`,
      },
      {
        titre: 'Tirage dans une urne', theme: 'Probabilités', points: 5,
        enonce: L`Une urne contient 3 boules rouges et 2 boules noires. On tire simultanément 2 boules.
\begin{enumerate}
\item Calculer la probabilité d'obtenir deux boules rouges.
\item Calculer la probabilité d'obtenir deux boules de couleurs différentes.
\item Soit $X$ le nombre de boules rouges tirées. Calculer $E(X)$.
\end{enumerate}`,
        corrige: L`Il y a $\binom{5}{2} = 10$ tirages. $P(\text{2 rouges}) = \frac{3}{10}$ ; $P(\text{couleurs différentes}) = \frac{3 \times 2}{10} = \frac{6}{10}$ ; $P(X = 0) = \frac{1}{10}$. $E(X) = 1 \times \frac{6}{10} + 2 \times \frac{3}{10} = \frac{6}{5}$.`,
      },
      {
        titre: 'Étude de fonction', theme: 'Dérivation', points: 5,
        enonce: L`Soit $f(x) = x^2 - 4x + 3$ sur $\mathbb{R}$.
\begin{enumerate}
\item Calculer $f'(x)$ et dresser le tableau de variation.
\item Résoudre $f(x) = 0$.
\item Donner l'équation de la tangente au point d'abscisse 0.
\end{enumerate}`,
        corrige: L`$f'(x) = 2x - 4$ ; $f$ décroît sur $]-\infty;2]$ et croît sur $[2;+\infty[$, minimum $f(2) = -1$. Racines : 1 et 3. Tangente : $y = -4x + 3$.`,
      },
    ],
  },
  {
    matiere: 'Mathématiques', serie: 'C', titre: 'Baccalauréat blanc · Mathématiques n° 2', dureeMin: 180,
    exercices: [
      {
        titre: 'Nombres complexes', theme: 'Nombres complexes', points: 5,
        enonce: L`\begin{enumerate}
\item Résoudre dans $\mathbb{C}$ l'équation $z^2 - 2z + 2 = 0$.
\item Donner le module et un argument de chaque solution.
\item Calculer $(1 + i)^8$.
\end{enumerate}`,
        corrige: L`$\Delta = -4$, solutions $1 + i$ et $1 - i$, de module $\sqrt{2}$ et d'arguments $\frac{\pi}{4}$ et $-\frac{\pi}{4}$. $(1 + i)^8 = (\sqrt{2})^8 e^{2i\pi} = 16$.`,
      },
      {
        titre: 'Fonction logarithme', theme: 'Fonctions', points: 5,
        enonce: L`Soit $f(x) = x - \ln x$ sur $]0;+\infty[$.
\begin{enumerate}
\item Déterminer les limites de $f$ en $0$ et en $+\infty$.
\item Étudier les variations de $f$.
\item En déduire que $\ln x \leq x - 1$ pour tout $x > 0$.
\end{enumerate}`,
        corrige: L`Limites : $+\infty$ en $0^+$ et $+\infty$ en $+\infty$ (car $f(x) = x(1 - \frac{\ln x}{x})$). $f'(x) = 1 - \frac{1}{x}$ : $f$ décroît sur $]0;1]$, croît ensuite, minimum $f(1) = 1$. Donc $x - \ln x \geq 1$, soit $\ln x \leq x - 1$.`,
      },
      {
        titre: 'Suite arithmétique', theme: 'Suites', points: 5,
        enonce: L`$(u_n)$ est arithmétique de premier terme $u_0 = 3$ et de raison 4.
\begin{enumerate}
\item Exprimer $u_n$ en fonction de $n$.
\item Calculer $S_n = u_0 + u_1 + \dots + u_n$.
\end{enumerate}`,
        corrige: L`$u_n = 3 + 4n$. $S_n = (n + 1)\dfrac{3 + 3 + 4n}{2} = (n + 1)(2n + 3)$.`,
      },
      {
        titre: 'Arithmétique', theme: 'Arithmétique', points: 5,
        enonce: L`\begin{enumerate}
\item Calculer le PGCD de 252 et 198 par l'algorithme d'Euclide.
\item Résoudre dans $\mathbb{Z}^2$ l'équation $14x - 11y = 1$.
\end{enumerate}`,
        corrige: L`$252 = 198 + 54$ ; $198 = 3 \times 54 + 36$ ; $54 = 36 + 18$ ; $36 = 2 \times 18$ : le PGCD vaut 18. Solution particulière $(4;5)$ car $56 - 55 = 1$ ; solutions : $x = 4 + 11k$, $y = 5 + 14k$, $k \in \mathbb{Z}$.`,
      },
    ],
  },
  {
    matiere: 'Physique-Chimie', serie: 'C', titre: 'Baccalauréat blanc · Physique-Chimie n° 1', dureeMin: 120,
    exercices: [
      {
        titre: 'Acide fort et dosage', theme: 'Chimie', points: 10,
        enonce: L`Une solution d'acide chlorhydrique a pour concentration $c = 1{,}0 \times 10^{-2}\ \text{mol/L}$.
\begin{enumerate}
\item Calculer son pH.
\item On la dilue dix fois. Quel est le nouveau pH ?
\item On dose 20,0 mL de la solution initiale par de la soude à $2{,}0 \times 10^{-2}\ \text{mol/L}$. Calculer le volume à l'équivalence et indiquer le pH à l'équivalence.
\end{enumerate}`,
        corrige: L`pH $= 2$. Après dilution : pH $= 3$. $V_{\text{éq}} = \dfrac{1{,}0 \times 10^{-2} \times 20{,}0}{2{,}0 \times 10^{-2}} = 10{,}0\ \text{mL}$ ; acide fort et base forte : pH $= 7$ à l'équivalence.`,
      },
      {
        titre: 'Chute libre', theme: 'Mécanique', points: 10,
        enonce: L`Une bille de masse $m = 0{,}50\ \text{kg}$ est lâchée sans vitesse initiale d'une hauteur $h = 20\ \text{m}$. On prend $g = 10\ \text{m/s}^2$ et on néglige les frottements.
\begin{enumerate}
\item Calculer la durée de la chute.
\item Calculer la vitesse à l'arrivée au sol.
\item Calculer l'énergie cinétique à l'arrivée.
\end{enumerate}`,
        corrige: L`$h = \frac{1}{2}gt^2$ donne $t = 2{,}0\ \text{s}$. $v = gt = 20\ \text{m/s}$. $E_c = \frac{1}{2}mv^2 = 100\ \text{J}$ (égale à $mgh$).`,
      },
    ],
  },
];
