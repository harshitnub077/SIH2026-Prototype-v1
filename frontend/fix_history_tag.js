const fs = require('fs');
let code = fs.readFileSync('app/history/page.jsx', 'utf8');

// Find the end of the map block
const strToReplace = `            })}
</div>
        </div>
      </div>
    </div>
  );
}`;

const correctStr = `            })}
        </div>
      </div>
    </div>
  );
}`;

// Actually let's just make sure there are exactly the right number of closing divs.
// The file should end with:
/*
          })}
        </div>
      </div>
    </div>
  );
}
*/
const lastMapIndex = code.lastIndexOf('})}');
code = code.substring(0, lastMapIndex + 3) + `
        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync('app/history/page.jsx', code);
console.log("HISTORY TAG FIXED");
