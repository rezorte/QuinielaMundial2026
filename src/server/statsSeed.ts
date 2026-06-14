type Squad = {
  goalkeepers: string[];
  defenders: string[];
  midfielders: string[];
  forwards: string[];
};

type TeamStatsSeed = {
  fifaRank?: number | null;
  coach?: string | null;
  stars: string[];
  squad: Squad;
  worldCup?: {
    appearances?: number | null;
    wins?: number | null;
    draws?: number | null;
    losses?: number | null;
    goalsFor?: number | null;
    goalsAgainst?: number | null;
    bestResult?: string | null;
  };
  sourceName: string;
  sourceUrl: string;
};

const sourceName = 'API-FOOTBALL Blog';
const sourceUrl = 'https://www.api-football.com/news/post/fifa-world-cup-2026-lineups-all-teams-coaches-and-players';

export const teamStatsSeed: Record<string, TeamStatsSeed> = {
  GER: {
    stars: ['Jamal Musiala', 'Florian Wirtz', 'Joshua Kimmich'],
    squad: {
      goalkeepers: ['Manuel Neuer', 'Oliver Baumann', 'Alexander Nübel'],
      defenders: ['Antonio Rüdiger', 'Waldemar Anton', 'Jonathan Tah', 'Joshua Kimmich', 'Nico Schlotterbeck', 'Nathaniel Brown', 'David Raum', 'Malick Thiaw'],
      midfielders: ['Aleksandar Pavlović', 'Leon Goretzka', 'Jamie Leweling', 'Jamal Musiala', 'Pascal Groß', 'Angelo Stiller', 'Florian Wirtz', 'Leroy Sané', 'Nadiem Amiri', 'Felix Nmecha', 'Lennart Karl'],
      forwards: ['Kai Havertz', 'Nick Woltemade', 'Maximilian Beier', 'Deniz Undav']
    },
    sourceName,
    sourceUrl
  },
  ENG: {
    stars: ['Harry Kane', 'Jude Bellingham', 'Bukayo Saka'],
    squad: {
      goalkeepers: ['Jordan Pickford', 'Dean Henderson', 'James Trafford'],
      defenders: ['Ezri Konsa', "Nico O'Reilly", 'John Stones', 'Marc Guéhi', 'Valentino Livramento', 'Daniel Burn', 'Reece James', 'Djed Spence', 'Jarell Quansah'],
      midfielders: ['Declan Rice', 'Elliot Anderson', 'Jude Bellingham', 'Jordan Henderson', 'Kobbie Mainoo', 'Morgan Rogers', 'Eberechi Eze'],
      forwards: ['Bukayo Saka', 'Harry Kane', 'Marcus Rashford', 'Anthony Gordon', 'Oliver Watkins', 'Noni Madueke', 'Ivan Toney']
    },
    sourceName,
    sourceUrl
  },
  AUT: {
    stars: ['David Alaba', 'Marcel Sabitzer', 'Konrad Laimer'],
    squad: {
      goalkeepers: ['Alexander Schlager', 'Florian Wiegele', 'Patrick Pentz'],
      defenders: ['David Affengruber', 'Kevin Danso', 'Stefan Posch', 'David Alaba', 'Philipp Lienhart', 'Phillip Mwene', 'Marco Friedl', 'Michael Svoboda'],
      midfielders: ['Xaver Schlager', 'Nicolas Seiwald', 'Marcel Sabitzer', 'Florian Grillitsch', 'Carney Chukwuemeka', 'Romano Schmid', 'Christoph Baumgartner', 'Konrad Laimer', 'Alexander Prass', 'Paul Wanner', 'Alessandro Schöpf'],
      forwards: ['Marko Arnautović', 'Michael Gregoritsch', 'Saša Kalajdžić', 'Patrick Wimmer']
    },
    sourceName,
    sourceUrl
  },
  BEL: {
    stars: ['Kevin De Bruyne', 'Romelu Lukaku', 'Jérémy Doku'],
    squad: {
      goalkeepers: ['Thibaut Courtois', 'Senne Lammens', 'Mike Penders'],
      defenders: ['Zeno Debast', 'Arthur Theate', 'Brandon Mechele', 'Maxim De Cuyper', 'Thomas Meunier', 'Koni De Winter', 'Joaquin Seys', 'Timothy Castagne', 'Nathan Ngoy'],
      midfielders: ['Axel Witsel', 'Kevin De Bruyne', 'Youri Tielemans', 'Diego Moreira', 'Hans Vanaken', 'Alexis Saelemaekers', 'Nicolas Raskin', 'Amadou Onana'],
      forwards: ['Romelu Lukaku', 'Leandro Trossard', 'Jérémy Doku', 'Dodi Lukebakio', 'Charles De Ketelaere', 'Matías Fernández-Pardo']
    },
    sourceName,
    sourceUrl
  },
  BIH: {
    stars: ['Edin Džeko', 'Ermedin Demirović', 'Sead Kolašinac'],
    squad: {
      goalkeepers: ['Nikola Vasilj', 'Mladen Jurkas', 'Martin Zlomislić'],
      defenders: ['Nihad Mujakić', 'Dennis Hadžikadunic', 'Tarik Muharemović', 'Sead Kolašinac', 'Amar Dedić', 'Nikola Katić', 'Stjepan Radeljić', 'Nidal Čelik'],
      midfielders: ['Benjamin Tahirović', 'Armin Gigović', 'Ivan Bašić', 'Ivan Šunjić', 'Amar Memić', 'Amir Hadžiahmetović', 'Dženis Burnić', 'Ermin Mahmić'],
      forwards: ['Samed Bazdar', 'Ermedin Demirović', 'Edin Džeko', 'Kerim Alajbegović', 'Esmir Bajraktarević', 'Haris Tabaković', 'Jovo Lukić']
    },
    sourceName,
    sourceUrl
  },
  CRO: {
    stars: ['Luka Modrić', 'Joško Gvardiol', 'Mateo Kovačić'],
    squad: {
      goalkeepers: ['Dominik Livaković', 'Ivor Pandur', 'Dominik Kotarski'],
      defenders: ['Josip Stanišić', 'Marin Pongračić', 'Joško Gvardiol', 'Duje Ćaleta-Car', 'Josip Šutalo', 'Kristijan Jakić', 'Luka Vušković', 'Martin Erlić'],
      midfielders: ['Nikola Moro', 'Mateo Kovačić', 'Luka Modrić', 'Nikola Vlašić', 'Mario Pašalić', 'Martin Baturina', 'Petar Sučić', 'Toni Fruk', 'Luka Sučić'],
      forwards: ['Andrej Kramarić', 'Ante Budimir', 'Ivan Perišić', 'Igor Matanović', 'Marco Pašalić', 'Petar Musa']
    },
    sourceName,
    sourceUrl
  },
  SCO: {
    stars: ['Scott McTominay', 'Andy Robertson', 'John McGinn'],
    squad: {
      goalkeepers: ['Angus Gunn', 'Liam Kelly', 'Craig Gordon'],
      defenders: ['Aaron Hickey', 'Andy Robertson', 'Grant Hanley', 'Kieran Tierney', 'Jack Hendry', 'John Souttar', 'Dominic Hyam', 'Nathan Patterson', 'Anthony Ralston', 'Scott McKenna'],
      midfielders: ['Scott McTominay', 'John McGinn', 'Tyler Fletcher', 'Ryan Christie', 'Lewis Ferguson', 'Kenny McLean'],
      forwards: ['Lyndon Dykes', 'Che Adams', 'Ross Stewart', 'Ben Gannon-Doak', 'George Hirst', 'Lawrence Shankland', 'Findlay Curtis']
    },
    sourceName,
    sourceUrl
  },
  ESP: {
    stars: ['Lamine Yamal', 'Rodrigo Hernández', 'Pedri'],
    squad: {
      goalkeepers: ['David Raya', 'Joan García', 'Unai Simón'],
      defenders: ['Marc Pubill', 'Álex Grimaldo', 'Eric García', 'Marcos Llorente', 'Pedro Porro', 'Aymeric Laporte', 'Pau Cubarsí', 'Marc Cucurella'],
      midfielders: ['Mikel Merino', 'Fabián Ruiz', 'Pablo Gavira', 'Álex Baena', 'Rodrigo Hernández', 'Martín Zubimendi', 'Pedro López'],
      forwards: ['Ferran Torres', 'Dani Olmo', 'Yeremy Pino', 'Nico Williams', 'Lamine Yamal', 'Mikel Oyarzabal', 'Víctor Muñoz', 'Borja Iglesias']
    },
    sourceName,
    sourceUrl
  },
  FRA: {
    stars: ['Kylian Mbappé', 'Ousmane Dembélé', 'Aurélien Tchouaméni'],
    squad: {
      goalkeepers: ['Brice Samba', 'Mike Maignan', 'Robin Risser'],
      defenders: ['Malo Gusto', 'Lucas Digne', 'Dayot Upamecano', 'Jules Koundé', 'Ibrahima Konaté', 'William Saliba', 'Théo Hernandez', 'Lucas Hernandez', 'Maxence Lacroix'],
      midfielders: ['Manu Koné', 'Aurélien Tchouaméni', "N'Golo Kanté", 'Adrien Rabiot', 'Warren Zaïre-Emery', 'Rayan Cherki', 'Maghnes Akliouche'],
      forwards: ['Ousmane Dembélé', 'Marcus Thuram', 'Kylian Mbappé', 'Michaël Olise', 'Bradley Barcola', 'Désiré Doué', 'Jean-Philippe Mateta']
    },
    sourceName,
    sourceUrl
  },
  NOR: {
    stars: ['Erling Haaland', 'Martin Ødegaard', 'Alexander Sørloth'],
    squad: {
      goalkeepers: ['Ørjan Nyland', 'Sander Tangvik', 'Egil Selvik'],
      defenders: ['Kristoffer Ajer', 'Leo Østigård', 'David Wolfe', 'Fredrik Bjørkan', 'Marcus Pedersen', 'Torbjørn Heggem', 'Sondre Langas', 'Henrik Falchener'],
      midfielders: ['Morten Thorsby', 'Patrick Berg', 'Sander Berge', 'Martin Ødegaard', 'Fredrik Aursnes', 'Kristian Thorstvedt', 'Thelo Aasgaard', 'Andreas Schjelderup', 'Oscar Bobb', 'Jens Hauge'],
      forwards: ['Alexander Sørloth', 'Erling Haaland', 'Jørgen Larsen', 'Antonio Nusa', 'Julian Ryerson']
    },
    sourceName,
    sourceUrl
  },
  NED: {
    stars: ['Virgil van Dijk', 'Frenkie de Jong', 'Cody Gakpo'],
    squad: {
      goalkeepers: ['Bart Verbruggen', 'Robin Roefs', 'Mark Flekken'],
      defenders: ['Jurriën Timber', 'Virgil van Dijk', 'Nathan Aké', 'Jan-Paul van Hecke', 'Mats Wieffer', 'Micky van de Ven', 'Denzel Dumfries', 'Jorrel Hato'],
      midfielders: ['Marten de Roon', 'Justin Kluivert', 'Ryan Gravenberch', 'Tijjani Reijnders', 'Guus Til', 'Teun Koopmeiners', 'Frenkie de Jong', 'Quinten Timber'],
      forwards: ['Wout Weghorst', 'Memphis Depay', 'Cody Gakpo', 'Noa Lang', 'Donyell Malen', 'Brian Brobbey', 'Crysencio Summerville']
    },
    sourceName,
    sourceUrl
  },
  POR: {
    stars: ['Cristiano Ronaldo', 'Bruno Fernandes', 'Bernardo Silva'],
    squad: {
      goalkeepers: ['Diogo Costa', 'José Sá', 'Rui Silva'],
      defenders: ['Nelson Semedo', 'Rúben Dias', 'Tomás Araújo', 'Diogo Dalot', 'Renato Veiga', 'Gonçalo Inácio', 'João Cancelo', 'Samu Costa', 'Nuno Mendes'],
      midfielders: ['Matheus Nunes', 'Bruno Fernandes', 'Bernardo Silva', 'João Neves', 'Rúben Neves', 'Vítor Ferreira'],
      forwards: ['Cristiano Ronaldo', 'Gonçalo Ramos', 'João Félix', 'Francisco Trincão', 'Rafael Leão', 'Pedro Neto', 'Gonçalo Guedes', 'Francisco Conceição']
    },
    sourceName,
    sourceUrl
  },
  SWE: {
    stars: ['Alexander Isak', 'Viktor Gyökeres', 'Dejan Kulusevski'],
    squad: {
      goalkeepers: ['Jacob Zetterström', 'Viktor Johansson', 'Kristoffer Nordfeldt'],
      defenders: ['Gustaf Lagerbielke', 'Victor Lindelöf', 'Isak Hien', 'Gabriel Gudmundsson', 'Herman Johansson', 'Daniel Svensson', 'Hjalmar Ekdal', 'Carl Starfelt', 'Eric Smith', 'Alexander Bernhardsson', 'Elliot Stroud'],
      midfielders: ['Lucas Bergvall', 'Benjamin Nygren', 'Ken Sema', 'Jesper Karlström', 'Yasin Ayari', 'Mattias Svanberg', 'Besfort Zeneli'],
      forwards: ['Alexander Isak', 'Anthony Elanga', 'Viktor Gyökeres', 'Gustaf Nilsson', 'Taha Ali']
    },
    sourceName,
    sourceUrl
  },
  SUI: {
    stars: ['Granit Xhaka', 'Manuel Akanji', 'Breel Embolo'],
    squad: {
      goalkeepers: ['Gregor Kobel', 'Yvon Mvogo', 'Marvin Keller'],
      defenders: ['Miro Muheim', 'Silvan Widmer', 'Nico Elvedi', 'Manuel Akanji', 'Ricardo Rodríguez', 'Eray Cömert', 'Aurèle Amenda', 'Luca Jaquez'],
      midfielders: ['Denis Zakaria', 'Remo Freuler', 'Johan Manzambi', 'Granit Xhaka', 'Ardon Jashari', 'Djibril Sow', 'Michel Aebischer', 'Fabian Rieder'],
      forwards: ['Breel Embolo', 'Dan Ndoye', 'Christian Fassnacht', 'Rubén Vargas', 'Noah Okafor', 'Zeki Amdouni', 'Cédric Itten']
    },
    sourceName,
    sourceUrl
  },
  CZE: {
    stars: ['Patrik Schick', 'Tomáš Souček', 'Adam Hložek'],
    squad: {
      goalkeepers: ['Matěj Kovář', 'Jindřich Staněk', 'Lukáš Horníček'],
      defenders: ['David Zima', 'Tomáš Holeš', 'Robin Hranáč', 'Vladimír Coufal', 'Štěpán Chaloupek', 'Ladislav Krejčí', 'David Jurásek', 'Jaroslav Zelený', 'David Doudera'],
      midfielders: ['Vladimír Darida', 'Lukáš Červ', 'Lukáš Provod', 'Michal Sadílek', 'Tomáš Souček', 'Alexandr Sojka', 'Hugo Šochůrek'],
      forwards: ['Adam Hložek', 'Patrik Schick', 'Jan Kuchta', 'Mojmír Chytil', 'Pavel Šulc', 'Tomáš Chorý', 'Denis Višinský']
    },
    sourceName,
    sourceUrl
  },
  TUR: {
    stars: ['Hakan Çalhanoğlu', 'Arda Güler', 'Kenan Yıldız'],
    squad: {
      goalkeepers: ['Mert Günok', 'Altay Bayındır', 'Uğurcan Çakır'],
      defenders: ['Zeki Çelik', 'Merih Demiral', 'Çağlar Söyüncü', 'Eren Elmalı', 'Abdülkerim Bardakçı', 'Ozan Kabak', 'Mert Müldür', 'Ferdi Kadıoğlu', 'Samet Akaydın'],
      midfielders: ['Salih Özcan', 'Orkun Kökcü', 'Hakan Çalhanoğlu', 'İsmail Yüksek', 'Kaan Ayhan'],
      forwards: ['Kerem Aktürkoğlu', 'Arda Güler', 'Deniz Gül', 'Kenan Yıldız', 'İrfan Kahveci', 'Yunus Akgün', 'Barış Yılmaz', 'Oğuz Aydın', 'Can Uzun']
    },
    sourceName,
    sourceUrl
  },
  ARG: {
    stars: ['Lionel Messi', 'Julián Álvarez', 'Lautaro Martínez'],
    squad: {
      goalkeepers: ['Juan Musso', 'Gerónimo Rulli', 'Emiliano Martínez'],
      defenders: ['Leonardo Balerdi', 'Nicolás Tagliafico', 'Gonzalo Montiel', 'Lisandro Martínez', 'Cristian Romero', 'Nicolás Otamendi', 'Facundo Medina', 'Nahuel Molina'],
      midfielders: ['Leandro Paredes', 'Rodrigo de Paul', 'Valentín Barco', 'Giovani Lo Celso', 'Exequiel Palacios', 'Nicolás González', 'Alexis Mac Allister', 'Enzo Fernández'],
      forwards: ['Julián Álvarez', 'Lionel Messi', 'Thiago Almada', 'Giuliano Simeone', 'Nicolás Paz', 'José López', 'Lautaro Martínez']
    },
    sourceName,
    sourceUrl
  },
  BRA: {
    stars: ['Vinícius Júnior', 'Neymar Santos', 'Alisson Becker'],
    squad: {
      goalkeepers: ['Alisson Becker', 'Weverton Caldeira', 'Ederson Moraes'],
      defenders: ['Wesley', 'Gabriel Magalhães', 'Marcos Corrêa', 'Alex Sandro', 'Danilo Luiz', 'Bremer', 'Léo Pereira', 'Douglas Santos', 'Roger Ibanez'],
      midfielders: ['Carlos Casimiro', 'Bruno Guimarães', 'Fábio Tavares', 'Danilo Santos', 'Lucas Paquetá'],
      forwards: ['Vinícius Júnior', 'Matheus Cunha', 'Neymar Santos', 'Raphael Belloli', 'Endrick Sousa', 'Luiz Henrique', 'Gabriel Martinelli', 'Igor Thiago', 'Rayan']
    },
    sourceName,
    sourceUrl
  },
  COL: {
    stars: ['Luis Díaz', 'James Rodríguez', 'Jhon Arias'],
    squad: {
      goalkeepers: ['David Ospina', 'Camilo Vargas', 'Álvaro Montero'],
      defenders: ['Daniel Muñoz', 'Jhon Lucumí', 'Santiago Arias', 'Yerry Mina', 'Gustavo Puerta', 'Johan Mojica', 'Willer Ditta', 'Deiver Machado', 'Dávinson Sánchez'],
      midfielders: ['Kevin Castaño', 'Richard Ríos', 'Jorge Carrascal', 'James Rodríguez', 'Jhon Arias', 'Juan Portilla', 'Jefferson Lerma', 'Juan Quintero'],
      forwards: ['Luis Díaz', 'Jhon Córdoba', 'Juan Hernández', 'Leandro Campaz', 'Luis Suárez', 'Andrés Gómez']
    },
    sourceName,
    sourceUrl
  },
  ECU: {
    stars: ['Moisés Caicedo', 'Piero Hincapié', 'Enner Valencia'],
    squad: {
      goalkeepers: ['Hernán Galíndez', 'Moisés Ramírez', 'Gonzalo Valle'],
      defenders: ['Félix Torres', 'Piero Hincapié', 'Joel Ordóñez', 'Willian Pacho', 'Pervis Estupiñán', 'Ángelo Preciado', 'Jackson Porozo', 'Yaimar Medina'],
      midfielders: ['Jordy Alcívar', 'Anthony Valencia', 'Kendry Páez', 'Alan Minda', 'Pedro Vite', 'Denil Castillo', 'Alan Franco', 'Moisés Caicedo'],
      forwards: ['John Yeboah', 'Kevin Rodríguez', 'Enner Valencia', 'Jordy Caicedo', 'Gonzalo Plata', 'Nilson Angulo', 'Jeremy Arévalo']
    },
    sourceName,
    sourceUrl
  },
  PAR: {
    stars: ['Miguel Almirón', 'Julio Enciso', 'Gustavo Gómez'],
    squad: {
      goalkeepers: ['Roberto Fernández', 'Orlando Gill', 'Gastón Olveira'],
      defenders: ['Gustavo Velázquez', 'Omar Alderete', 'Juan Cáceres', 'Fabián Balbuena', 'Junior Alonso', 'José Canale', 'Gustavo Gómez', 'Alexandro Maidana'],
      midfielders: ['Ramón Sosa', 'Diego Gómez', 'Miguel Almirón', 'Mauricio', 'Andrés Cubas', 'Damián Bobadilla', 'Braian Ojeda', 'Matías Galarza', 'Gustavo Caballero'],
      forwards: ['Antonio Sanabria', 'Alejandro Romero', 'Álex Arce', 'Julio Enciso', 'Gabriel Ávalos', 'Isidro Pitta']
    },
    sourceName,
    sourceUrl
  },
  URU: {
    stars: ['Federico Valverde', 'Darwin Núñez', 'Ronald Araújo'],
    squad: {
      goalkeepers: ['Sergio Rochet', 'Santiago Mele', 'Fernando Muslera'],
      defenders: ['José Giménez', 'Sebastián Cáceres', 'Ronald Araújo', 'Guillermo Varela', 'Mathías Olivera', 'Matías Viña', 'Santiago Bueno'],
      midfielders: ['Manuel Ugarte', 'Rodrigo Bentancur', 'Nicolás de la Cruz', 'Federico Valverde', 'Giorgian de Arrascaeta', 'Agustín Canobbio', 'Emiliano Martínez', 'Maximiliano Araújo', 'Joaquín Piquerez', 'Juan Sanabria', 'Rodrigo Zalazar'],
      forwards: ['Darwin Núñez', 'Facundo Pellistri', 'Brian Rodríguez', 'Rodrigo Aguirre', 'Federico Viñas']
    },
    sourceName,
    sourceUrl
  },
  CAN: {
    stars: ['Alphonso Davies', 'Jonathan David', 'Stephen Eustaquio'],
    squad: {
      goalkeepers: ['Dayne St. Clair', 'Maxime Crépeau', 'Owen Goodman'],
      defenders: ['Alistair Johnston', 'Alfie Jones', 'Luc de Fougerolles', 'Joel Waterman', 'Derek Cornelius', 'Moïse Bombito', 'Alphonso Davies', 'Richie Laryea', 'Niko Sigur'],
      midfielders: ['Mathieu Choinière', 'Stephen Eustaquio', 'Ismaël Koné', 'Liam Millar', 'Jacob Shaffelburg', 'Jonathan Osorio', 'Nathan Saliba', 'Marcelo Flores'],
      forwards: ['Cyle Larin', 'Jonathan David', 'Tani Oluwaseyi', 'Tajon Buchanan', 'Ali Ahmed', 'Promise David']
    },
    sourceName,
    sourceUrl
  },
  USA: {
    stars: ['Christian Pulisic', 'Weston McKennie', 'Tyler Adams'],
    squad: {
      goalkeepers: ['Matt Turner', 'Matt Freese', 'Chris Brady'],
      defenders: ['Sergiño Dest', 'Chris Richards', 'Antonee Robinson', 'Auston Trusty', 'Miles Robinson', 'Tim Ream', 'Alex Freeman', 'Max Arfsten', 'Mark McKenzie', 'Joe Scally'],
      midfielders: ['Tyler Adams', 'Giovanni Reyna', 'Weston McKennie', 'Sebastian Berhalter', 'Cristian Roldán', 'Malik Tillman'],
      forwards: ['Ricardo Pepi', 'Christian Pulisic', 'Brenden Aaronson', 'Haji Wright', 'Folarin Balogun', 'Timothy Weah', 'Alex Zendejas']
    },
    sourceName,
    sourceUrl
  },
  MEX: {
    stars: ['Santiago Giménez', 'Edson Álvarez', 'Raúl Jiménez'],
    squad: {
      goalkeepers: ['Raúl Rangel', 'Carlos Acevedo', 'Guillermo Ochoa'],
      defenders: ['Jorge Sánchez', 'César Montes', 'Edson Álvarez', 'Johan Vásquez', 'Israel Reyes', 'Mateo Chávez', 'Jesús Gallardo'],
      midfielders: ['Erik Lira', 'Luis Romo', 'Álvaro Fidalgo', 'Orbelín Piñeda', 'Obed Vargas', 'Gilberto Mora', 'Luis Chávez', 'Brian Gutiérrez'],
      forwards: ['Raúl Jiménez', 'Alexis Vega', 'Santiago Giménez', 'Armando González', 'Julián Quiñones', 'César Huerta', 'Guillermo Martínez', 'Roberto Alvarado']
    },
    sourceName,
    sourceUrl
  },
  CUW: {
    stars: ['Leandro Bacuna', 'Juninho Bacuna', 'Tahith Chong'],
    squad: {
      goalkeepers: ['Eloy Room', 'Tyrick Bodak', 'Trevor Doornbusch'],
      defenders: ['Shurandy Sambo', 'Jurien Gaari', 'Roshon van Eijma', 'Sherel Floranus', 'Armando Obispo', 'Joshua Brenet', 'Riechedly Bazoer', 'Deveron Fonville'],
      midfielders: ['Godfried Roemeratoe', 'Juninho Bacuna', 'Livano Comenencia', 'Leandro Bacuna', 'Arjany Martha', 'Tahith Chong', 'Kevin Felida'],
      forwards: ['Jürgen Locadia', 'Jeremy Antonisse', 'Sontje Hansen', 'Tyrese Noslin', 'Kenji Gorre', 'Jearl Margaritha', 'Brandley Kuwas', 'Gervane Kastaneer']
    },
    sourceName,
    sourceUrl
  },
  HAI: {
    stars: ['Duckens Nazon', 'Jean-Ricner Bellegarde', 'Frantzdy Pierrot'],
    squad: {
      goalkeepers: ['Johny Placide', 'Alexandre Pierre', 'Josué Duverger'],
      defenders: ['Carlens Arcus', 'Keeto Thermoncy', 'Ricardo Ade', 'Hannes Delcroix', 'Martin Expérience', 'Markhus Lacroix', 'Jean-Kevin Duverne', 'Wilguens Paugain'],
      midfielders: ['Carl Sainte', 'Jean-Ricner Bellegarde', 'Leverton Pierre', 'Danley Jean Jacques', 'Dominique Simon', 'Woodensky Pierre'],
      forwards: ['Derrick Etienne', 'Duckens Nazon', 'Louicius Deedson', 'Ruben Providence', 'Lenny Joseph', 'Wilson Isidor', 'Yassin Fortune', 'Frantzdy Pierrot']
    },
    sourceName,
    sourceUrl
  },
  PAN: {
    stars: ['Adalberto Carrasquilla', 'José Fajardo', 'Michael Murillo'],
    squad: {
      goalkeepers: ['Luis Mejía', 'César Samudio', 'Orlando Mosquera'],
      defenders: ['César Blackman', 'José Córdoba', 'Fidel Escobar', 'Edgardo Farina', 'Jiovany Ramos', 'Carlos Harvey', 'Eric Davis', 'Andrés Andrade', 'Amir Murillo', 'Roderick Miller', 'Jorge Gutiérrez'],
      midfielders: ['Cristian Martínez', 'José Rodríguez', 'Adalberto Carrasquilla', 'Ismael Díaz', 'Edgar Bárcenas', 'Alberto Quintero', 'Aníbal Godoy', 'César Yanis'],
      forwards: ['Tomás Rodríguez', 'José Fajardo', 'Cecilio Waterman', 'Azarías Londoño']
    },
    sourceName,
    sourceUrl
  },
  RSA: {
    stars: ['Ronwen Williams', 'Teboho Mokoena', 'Lyle Foster'],
    squad: {
      goalkeepers: ['Ronwen Williams', 'Sipho Chaine', 'Ricardo Goss'],
      defenders: ['Thabang Matuludi', 'Khulumani Ndamane', 'Aubrey Modiba', 'Mbekezeli Mbokazi', 'Samukelo Kabini', 'Nkosinathi Sibisi', 'Khuliso Mudau', 'Ime Okon', 'Olwethu Makhanya', 'Bradley Cross'],
      midfielders: ['Teboho Mokoena', 'Thalente Mbatha', 'Themba Zwane', 'Sphephelo Sithole', 'Jayden Adams'],
      forwards: ['Oswin Appollis', 'Tshepang Moremi', 'Lyle Foster', 'Relebohile Mofokeng', 'Thapelo Maseko', 'Iqraam Rayners', 'Evidence Makgopa', 'Kamogelo Sebelebele']
    },
    sourceName,
    sourceUrl
  },
  ALG: {
    stars: ['Riyad Mahrez', 'Amine Gouiri', 'Rayan Aït-Nouri'],
    squad: {
      goalkeepers: ['Melvin Mastil', 'Oussama Benbot', 'Luca Zidane'],
      defenders: ['Aïssa Mandi', 'Achraf Abada', 'Mohamed Tougaï', 'Zineddine Belaïd', 'Jaouen Hadjam', 'Rayan Aït-Nouri', 'Rafik Belghali', 'Ramy Bensebaini', 'Samir Chergui'],
      midfielders: ['Ramiz Zerrouki', 'Houssem Aouar', 'Fares Chaïbi', 'Hicham Boudaoui', 'Nabil Bentaleb', 'Ibrahim Maza', 'Yassine Titraoui'],
      forwards: ['Riyad Mahrez', 'Amine Gouiri', 'Anis Hadj Moussa', 'Nadhir Benbouali', 'Mohamed Amoura', 'Adil Boulbina', 'Fares Ghedjemis']
    },
    sourceName,
    sourceUrl
  },
  CPV: {
    stars: ['Ryan Mendes', 'Garry Rodrigues', 'Logan Costa'],
    squad: {
      goalkeepers: ['Vozinha', 'Márcio Rosa', 'CJ Dos Santos'],
      defenders: ['Stopira', 'Diney Borges', 'Pico Lopes', 'Logan Costa', 'Sidny Cabral', 'Steven Moreira', 'Wagner Pina', 'Kelvin Pires'],
      midfielders: ['Kevin Pina', 'Jovane Cabral', 'João Paulo', 'Jamiro Monteiro', 'Garry Rodrigues', 'Deroy Duarte', 'Laros Duarte', 'Yannick Semedo', 'Willy Semedo', 'Telmo Arcanjo', 'Nuno da Costa', 'Hélio Varela'],
      forwards: ['Gilson Benchimol', 'Dailon Livramento', 'Ryan Mendes']
    },
    sourceName,
    sourceUrl
  },
  CIV: {
    stars: ['Franck Kessié', 'Simon Adingra', 'Amad Diallo'],
    squad: {
      goalkeepers: ['Yahia Fofana', 'Mohamed Koné', 'Alban Lafont'],
      defenders: ['Ousmane Diomandé', 'Ghislain Konan', 'Wilfried Singo', 'Odilon Kossounou', 'Christopher Operi', 'Guela Doué', 'Emmanuel Agbadou', 'Evan Ndicka'],
      midfielders: ['Jean Séri', 'Seko Fofana', 'Franck Kessié', 'Ibrahim Sangaré', 'Parfait Guiagon', 'Christ Oulai'],
      forwards: ['Ange-Yoan Bonny', 'Simon Adingra', 'Yan Diomandé', 'Elye Wahi', 'Oumar Diakité', 'Amad Diallo', 'Nicolas Pépé', 'Evann Guessand', 'Bazoumana Touré']
    },
    sourceName,
    sourceUrl
  },
  EGY: {
    stars: ['Mohamed Salah', 'Omar Marmoush', 'Mahmoud Hassan'],
    squad: {
      goalkeepers: ['Mohamed Elshenawy', 'Mahdy Soliman', 'Mostafa Shoubir', 'Mohamed Alaa'],
      defenders: ['Yasser Ibrahim', 'Mohamed Hany', 'Hossam Abdelmaguid', 'Ramy Rabia', 'Mohamed Abdelmoneim', 'Ahmed Fatouh', 'Karim Hafez', 'Tarek Alaa'],
      midfielders: ['Emam Ashour', 'Mostafa Zico', 'Hamdy Fathy', 'Mohanad Lashin', 'Nabil Donga', 'Marawan Attia', 'Mahmoud Saber'],
      forwards: ['Mahmoud Hassan', 'Hamza Abdelkarim', 'Mohamed Salah', 'Haissem Hassan', 'Ibrahim Adel', 'Omar Marmoush', 'Mahmoud Hamdy']
    },
    sourceName,
    sourceUrl
  },
  GHA: {
    stars: ['Thomas Partey', 'Jordan Ayew', 'Iñaki Williams'],
    squad: {
      goalkeepers: ['Lawrence Zigi', 'Joseph Anang', 'Benjamin Asare'],
      defenders: ['Alidu Seidu', 'Jonas Adjetey', 'Abdul Mumin', 'Gideon Mensah', 'Baba Rahman', 'Jerome Opoku', 'Kojo Oppong', 'Derrick Luckassen', 'Marvin Senaya'],
      midfielders: ['Caleb Yirenkyi', 'Thomas Partey', 'Kwasi Sibo', 'Antoine Semenyo', 'Elisha Owusu', 'Augustine Boakye'],
      forwards: ['Fatawu Issahaku', 'Jordan Ayew', 'Brandon Thomas-Asante', 'Christopher Baah', 'Iñaki Williams', 'Kamaldeen Sulemana', 'Ernest Nuamah', 'Prince Adu']
    },
    sourceName,
    sourceUrl
  },
  MAR: {
    stars: ['Achraf Hakimi', 'Brahim Díaz', 'Yassine Bounou'],
    squad: {
      goalkeepers: ['Yassine Bounou', 'Munir El Kajoui', 'Ahmed Tagnaouti'],
      defenders: ['Achraf Hakimi', 'Noussair Mazraoui', 'Nayef Aguerd', 'Zakaria El Ouahdi', 'Issa Diop', 'Chadi Riad', 'Youssef Belammari', 'Redouane Halhal', 'Anass Salah-Eddine'],
      midfielders: ['Sofyan Amrabat', 'Ayyoub Bouaddi', 'Chemsdine Talbi', 'Azzedine Ounahi', 'Ismaël Saibari', 'Samir El Mourabet', 'Gessime Yassine', 'Bilal El Khannouss', 'Neil El Aynaoui'],
      forwards: ['Soufiane Rahimi', 'Brahim Díaz', 'Abde Ezzalzouli', 'Ayoub El Kaabi', 'Ayoub Amaimouni']
    },
    sourceName,
    sourceUrl
  },
  COD: {
    stars: ['Yoane Wissa', 'Chancel Mbemba', 'Cédric Bakambu'],
    squad: {
      goalkeepers: ['Lionel Mpasi', 'Timothy Fayulu', 'Matthieu Epolo'],
      defenders: ['Aaron Wan-Bissaka', 'Steve Kapuadi', 'Axel Tuanzebe', 'Dylan Batubinsika', 'Joris Kayembe', 'Chancel Mbemba', 'Gédéon Kalulu', 'Arthur Masuaku'],
      midfielders: ['Ngalayel Mukau', 'Nathanaël Mbuku', 'Samuel Moutoussamy', 'Théo Bongonda', 'Noah Sadiki', 'Aaron Tshibola', 'Charles Pickel', 'Edo Kayembe'],
      forwards: ['Brian Cipenga', 'Gaël Kakuta', 'Meschack Elia', 'Cédric Bakambu', 'Fiston Mayele', 'Yoane Wissa', 'Simon Banza']
    },
    sourceName,
    sourceUrl
  },
  SEN: {
    stars: ['Sadio Mané', 'Kalidou Koulibaly', 'Nicolas Jackson'],
    squad: {
      goalkeepers: ['Yehvann Diouf', 'Édouard Mendy', 'Mory Diaw'],
      defenders: ['Mamadou Sarr', 'Kalidou Koulibaly', 'Abdoulaye Seck', 'Ismail Jakobs', 'Krepin Diatta', 'Moussa Niakhaté', 'Antoine Mendy', 'El Hadji Diouf'],
      midfielders: ['Idrissa Gueye', 'Pathé Ciss', 'Lamine Camara', 'Pape Sarr', 'Habib Diarra', 'Bara Ndiaye', 'Pape Gueye'],
      forwards: ['Assane Diao', 'Bamba Dieng', 'Sadio Mané', 'Nicolas Jackson', 'Chérif Ndiaye', 'Iliman Ndiaye', 'Ismaïla Sarr', 'Ibrahim Mbaye']
    },
    sourceName,
    sourceUrl
  },
  TUN: {
    stars: ['Ellyes Skhiri', 'Hannibal Mejbri', 'Yan Valery'],
    squad: {
      goalkeepers: ['Mouhib Chamakh', 'Aymen Dahmen', 'Sabri Ben Hessen'],
      defenders: ['Ali Abdi', 'Montassar Talbi', 'Omar Rekik', 'Adam Arous', 'Dylan Bronn', 'Mortadha Ben Ouanes', 'Yan Valery', 'Mohamed Ben Hmida', 'Moutaz Neffati', 'Raed Chikhaoui'],
      midfielders: ['Hannibal Mejbri', 'Ismaël Gharbi', 'Rani Khedira', 'Khalil Ayari', 'Mohamed Hadj Mahmoud', 'Ellyes Skhiri', 'Anis Slimane', 'Sebastian Tounekti'],
      forwards: ['Elias Achouri', 'Elias Saad', 'Hazem Mastouri', 'Rayan Elloumi', 'Firas Chaouat']
    },
    sourceName,
    sourceUrl
  },
  KSA: {
    stars: ['Salem Al-Dawsari', 'Feras Al-Brikan', 'Mohamed Kanno'],
    squad: {
      goalkeepers: ['Nawaf Al-Aqidi', 'Mohammed Al-Owais', 'Ahmed Al-Kassar'],
      defenders: ['Ali Majrashi', 'Ali Lajami', 'Abdulelah Al-Amri', 'Hassan Al-Tambakti', 'Saud Abdulhamid', 'Nawaf Bu Washl', 'Hassan Kadish', 'Moteb Al-Harbi', 'Jehad Thikri', 'Mohammed Abu Alshamat'],
      midfielders: ['Nasser Al-Dawsari', 'Musab Al-Juwayr', 'Abdullah Al-Khaibari', 'Ziyad Al-Johani', 'Ala Al-Hajji', 'Mohamed Kanno'],
      forwards: ['Aiman Yahya', 'Feras Al-Brikan', 'Salem Al-Dawsari', 'Saleh Al-Shehri', 'Khalid Al-Ghannam', 'Abdullah Al-Hamddan', 'Sultan Mandash']
    },
    sourceName,
    sourceUrl
  },
  AUS: {
    stars: ['Mathew Ryan', 'Harry Souttar', 'Jackson Irvine'],
    squad: {
      goalkeepers: ['Mathew Ryan', 'Paul Izzo', 'Patrick Beach'],
      defenders: ['Miloš Degenek', 'Alessandro Circati', 'Jacob Italiano', 'Jordan Bos', 'Jason Geria', 'Kai Trewin', 'Aziz Behich', 'Harry Souttar', 'Cameron Burgess', 'Lucas Herrington'],
      midfielders: ['Connor Metcalfe', "Aiden O'Neill", 'Cameron Devlin', 'Jackson Irvine', 'Paul Okon-Engstler'],
      forwards: ['Mathew Leckie', 'Mohamed Touré', 'Ajdin Hrustić', 'Awer Mabil', 'Nestory Irankunda', 'Cristian Volpato', 'Nishan Velupillay', 'Tete Yengi']
    },
    sourceName,
    sourceUrl
  },
  IRQ: {
    stars: ['Aymen Hussein', 'Ali Jasim', 'Zidane Iqbal'],
    squad: {
      goalkeepers: ['Fahad Talib', 'Jalal Hassan', 'Ahmed Basil'],
      defenders: ['Rebin Ghareeb', 'Hussein Ali', 'Zaid Tahseen', 'Akam Hashim', 'Munaf Younus', 'Ahmed Yahya', 'Merchas Doski', 'Mustafa Saadoon', 'Frans Putros'],
      midfielders: ['Youssef Amyn', 'Ibrahim Bayesh', 'Zidane Iqbal', 'Amir Al-Ammari', 'Kevin Yakob', 'Aimar Sher', 'Zaid Ismael'],
      forwards: ['Ali Al-Hamadi', 'Mohanad Ali', 'Ahmed Qasim', 'Ali Yousif', 'Ali Jasim', 'Aymen Hussein', 'Marko Farji']
    },
    sourceName,
    sourceUrl
  },
  JPN: {
    stars: ['Takefusa Kubo', 'Wataru Endo', 'Takehiro Tomiyasu'],
    squad: {
      goalkeepers: ['Zion Suzuki', 'Keisuke Osako', 'Tomoki Hayakawa'],
      defenders: ['Yukinari Sugawara', 'Shogo Taniguchi', 'Kou Itakura', 'Yuto Nagatomo', 'Tsuyoshi Watanabe', 'Ayumu Seko', 'Hiroki Ito', 'Takehiro Tomiyasu', 'Junnosuke Suzuki'],
      midfielders: ['Wataru Endo', 'Ao Tanaka', 'Takefusa Kubo', 'Ritsu Doan', 'Daizen Maeda', 'Keito Nakamura', 'Junya Ito', 'Daichi Kamada', 'Yuito Suzuki', 'Kaishu Sano'],
      forwards: ['Keisuke Goto', 'Ayase Ueda', 'Koki Ogawa', 'Kento Shiogai']
    },
    sourceName,
    sourceUrl
  },
  JOR: {
    stars: ['Mousa Al-Tamari', 'Nizar Al-Rashdan', 'Ali Olwan'],
    squad: {
      goalkeepers: ['Yazeed Abu Laila', 'Nour Baniateyah', 'Abdallah Al-Fakhori'],
      defenders: ['Mohammad Abu Hasheesh', 'Abdallah Nasib', 'Husam Abu Dahab', 'Yazan Al-Arab', 'Mohammad Abu Al-Nadi', 'Saleem Obaid', 'Saed Al-Rosan', 'Ehsan Haddad', 'Anas Badawi'],
      midfielders: ['Amer Jamous', 'Noor Al-Rawabdeh', 'Rajaei Ayed', 'Ibrahim Sadeh', 'Mohannad Abu Taha', 'Nizar Al-Rashdan', 'Mohammad Al-Daoud'],
      forwards: ['Mohammad Abu Zraiq', 'Ali Olwan', 'Mousa Al-Tamari', 'Odeh Fakhoury', 'Mahmoud Al-Mardi', 'Ibrahim Sabra', 'Ali Azaizeh']
    },
    sourceName,
    sourceUrl
  },
  UZB: {
    stars: ['Eldor Shomurodov', 'Abdukodir Khusanov', 'Jaloliddin Masharipov'],
    squad: {
      goalkeepers: ['Utkir Yusupov', 'Abduvohid Nematov', 'Botirali Ergashev'],
      defenders: ['Abdukodir Khusanov', 'Khojiakbar Alijonov', 'Farrukh Sayfiev', 'Rustam Ashurmatov', 'Sherzod Nasrullaev', 'Umar Eshmurodov', 'Abdulla Abdullaev', 'Behruzjon Karimov', 'Avazbek Ulmasaliyev', 'Jakhongir Urozov'],
      midfielders: ['Akmal Mozgovoy', 'Otabek Shukurov', 'Jamshid Iskanderov', 'Odiljon Xamrobekov', 'Jaloliddin Masharipov', 'Oston Urunov', 'Dostonbek Khamdamov', 'Azizjon Ganiev', 'Abbosbek Fayzullaev', 'Sherzod Esanov'],
      forwards: ['Eldor Shomurodov', 'Azizbek Amonov', 'Igor Sergeev']
    },
    sourceName,
    sourceUrl
  },
  QAT: {
    stars: ['Akram Afif', 'Almoez Ali', 'Hassan Al-Haydos'],
    squad: {
      goalkeepers: ['Mahmoud Abu Nada', 'Salah Zakaria', 'Meshaal Barsham'],
      defenders: ['Pedro Miguel', 'Lucas Mendes', 'Issa Laye', 'Jassem Gaber', 'Ayoub Aloui', 'Homam Ahmed', 'Boualem Khoukhi', 'Sultan Al-Brake', 'Al-Hashmi Al-Hussein'],
      midfielders: ['Abdulaziz Hatem', 'Karim Boudiaf', 'Ahmed Al-Ganehi', 'Ahmed Fathy', 'Assim Madibo'],
      forwards: ['Ahmed Alaaeldin', 'Edmilson Júnior', 'Mohammed Muntari', 'Hassan Al-Haydos', 'Akram Afif', 'Yusuf Abdurisag', 'Almoez Ali', 'Tahsin Jamshid', 'Mohamed Manai']
    },
    sourceName,
    sourceUrl
  },
  KOR: {
    stars: ['Heungmin Son', 'Minjae Kim', 'Kangin Lee'],
    squad: {
      goalkeepers: ['Seunggyu Kim', 'Bumkeun Song', 'Hyeonwoo Jo'],
      defenders: ['Hanbeom Lee', 'Minjae Kim', 'Taehyeon Kim', 'Taeseok Lee', 'Wije Cho', 'Moonhwan Kim', 'Jinseob Park', 'Youngwoo Seol', 'Jens Castrop'],
      midfielders: ['Gihyuk Lee', 'Inbeom Hwang', 'Seungho Paik', 'Jaesung Lee', 'Heechan Hwang', 'Junho Bae', 'Kangin Lee', 'Hyunjun Yang', 'Jingyu Kim', 'Jisung Eom', 'Donggyeong Lee'],
      forwards: ['Heungmin Son', 'Guesung Cho', 'Hyeongyu Oh']
    },
    sourceName,
    sourceUrl
  },
  IRN: {
    stars: ['Mehdi Taremi', 'Alireza Jahanbakhsh', 'Alireza Beiranvand'],
    squad: {
      goalkeepers: ['Alireza Beiranvand', 'Payam Niazmand', 'Hossein Hosseini'],
      defenders: ['Saleh Hardani', 'Ehsan Hajisafi', 'Shoja Khalilzadeh', 'Milad Mohammadi', 'Hossein Kanani', 'Arya Yousefi', 'Ali Nemati', 'Ramin Rezaeian', 'Danial Iri'],
      midfielders: ['Saeid Ezatolahi', 'Alireza Jahanbakhsh', 'Mohammad Mohebbi', 'Saman Ghoddos', 'Roozbeh Cheshmi', 'Mehdi Torabi', 'Mohammad Ghorbani', 'Amirmohammad Razaghinia'],
      forwards: ['Mehdi Taremi', 'Mehdi Ghayedi', 'Ali Alipour', 'Amirhossein Hosseinzadeh', 'Shahriyar Moghanloo', 'Dennis Dargahi']
    },
    sourceName,
    sourceUrl
  },
  NZL: {
    stars: ['Chris Wood', 'Liberato Cacace', 'Marko Stamenić'],
    squad: {
      goalkeepers: ['Max Crocombe', 'Alex Paulsen', 'Michael Woud'],
      defenders: ['Tim Payne', 'Francis de Vries', 'Tyler Bindon', 'Michael Boxall', 'Liberato Cacace', 'Nando Pijnaker', 'Finn Surman', 'Callan Elliot', 'Tommy Smith'],
      midfielders: ['Joe Bell', 'Matthew Garbett', 'Marko Stamenić', 'Sarpreet Singh', 'Elijah Just', 'Alex Rufer', 'Ben Old', 'Callum McCowatt', 'Ryan Thomas', 'Lachlan Bayliss'],
      forwards: ['Chris Wood', 'Kosta Barbarouses', 'Ben Waine', 'Jesse Randall']
    },
    sourceName,
    sourceUrl
  }
};
