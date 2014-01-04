start = __ program:Program __ { return program; }

/* ===== A.1 Lexical Grammar ===== */

SourceCharacter
  = .

WhiteSpace "whitespace"
  = [\t\v\f \u00A0\uFEFF]

LineTerminator
  = [\n\r\u2028\u2029]

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028" // line separator
  / "\u2029" // paragraph separator

Comment "comment"
  = MultiLineComment
  / SingleLineComment

MultiLineComment
  = "/*" (!"*/" SourceCharacter)* "*/"

MultiLineCommentNoLineTerminator
  = "/*" (!("*/" / LineTerminator) SourceCharacter)* "*/"

SingleLineComment
  = "//" (!LineTerminator SourceCharacter)*

Identifier "identifier"
  = !ReservedWord name:IdentifierName { 
  		return name; 
  	}

IdentifierName "identifier"
  = start:IdentifierStart parts:IdentifierPart* {
      return start + parts.join("");
    }

IdentifierStart
  = [a-zA-Z]
  / "_"
  / "\\" sequence:UnicodeEscapeSequence { return sequence; }

IdentifierPart
  = IdentifierStart
  / [0-9]

ReservedWord
  = Keyword
  / TypeSpecifier
  / FutureReservedWord
  / NullLiteral
  / BooleanLiteral

Keyword
  = (
        "break"
      / "case"
      / "catch"
      / "continue"
      / "debugger"
      / "default"
      / "delete"
      / "do"
      / "else"
      / "finally"
      / "for"
      / "function"
      / "if"
      / "instanceof"
      / "in"
      / "new"
      / "return"
      / "switch"
      / "this"
      / "throw"
      / "try"
      / "typeof"
      / "var"
      / "void"
      / "while"
      / "with"
    )
    !IdentifierPart

FutureReservedWord
  = (
        "class"
      / "const"
      / "enum"
      / "export"
      / "extends"
      / "import"
      / "super"
    )
    !IdentifierPart

/*
 * This rule contains an error in the specification: |RegularExpressionLiteral|
 * is missing.
 */
Literal
  = NullLiteral
  / BooleanLiteral
  / value:NumericLiteral {
  		return AST.literal(value, "NumericLiteral", {line:line, column:column});
      /*
      return {
        type:  "NumericLiteral",
        value: value
      };
      */
    }
  / value:StringLiteral {
  		return AST.literal(value, "StringLiteral", {line:line, column:column});
  		/*
      return {
        type:  "StringLiteral",
        value: value
      };
      */
    }

NullLiteral
  = NullToken { 
  		return AST.literal(null, "NullLiteral", {line:line, column:column});
  	//return { type: "NullLiteral" }; 
  }

BooleanLiteral
  = TrueToken  { 
  		return AST.literal(true, "BooleanLiteral", {line:line, column:column});
  		//return { type: "BooleanLiteral", value: true  }; 
  	}
  / FalseToken { 
  		return AST.literal(false, "BooleanLiteral", {line:line, column:column});
  		//return { type: "BooleanLiteral", value: false }; 
  	}

NumericLiteral "number"
  = literal:(HexIntegerLiteral / DecimalLiteral) !IdentifierStart {
      return literal;
    }

DecimalLiteral
  = parts:(DecimalIntegerLiteral "." DecimalDigits? ExponentPart?) {
      return parseFloat(parts.join(""));
    }
  / parts:("." DecimalDigits ExponentPart?)     { return parseFloat(parts.join("")); }
  / parts:(DecimalIntegerLiteral ExponentPart?) { return parseFloat(parts.join("")); }

DecimalIntegerLiteral
  = "0" 
  / (head:NonZeroDigit tail:DecimalDigits? {
      var result = [head];
      if (tail) result = result.concat(tail);
      return result.join("");
  })

DecimalDigits
  = digits:DecimalDigit+ {
    if (digits) return digits.join("");
  }

DecimalDigit
  = [0-9]

NonZeroDigit
  = [1-9]

ExponentPart
  = parts:(ExponentIndicator SignedInteger) {
      return parts.join("");
  }

ExponentIndicator
  = [eE]

SignedInteger
  = parts:([-+]? DecimalDigits) {
      return parts.join("");
  }

HexIntegerLiteral
  = "0" [xX] digits:HexDigit+ { return parseInt("0x" + digits); }

HexDigit
  = [0-9a-fA-F]

StringLiteral "string"
  = parts:('"' DoubleStringCharacters? '"' / "'" SingleStringCharacters? "'") {
      return parts[1];
    }

DoubleStringCharacters
  = chars:DoubleStringCharacter+ { return chars.join(""); }

SingleStringCharacters
  = chars:SingleStringCharacter+ { return chars.join(""); }

DoubleStringCharacter
  = !('"' / "\\" / LineTerminator) char_:SourceCharacter { return char_;     }
  / "\\" sequence:EscapeSequence                         { return sequence;  }
  / LineContinuation

SingleStringCharacter
  = !("'" / "\\" / LineTerminator) char_:SourceCharacter { return char_;     }
  / "\\" sequence:EscapeSequence                         { return sequence;  }
  / LineContinuation

LineContinuation
  = "\\" sequence:LineTerminatorSequence { return sequence; }

EscapeSequence
  = CharacterEscapeSequence
  / "0" !DecimalDigit { return "\0"; }
  / HexEscapeSequence
  / UnicodeEscapeSequence

CharacterEscapeSequence
  = SingleEscapeCharacter
  / NonEscapeCharacter

SingleEscapeCharacter
  = char_:['"\\bfnrtv] {
      return char_
        .replace("b", "\b")
        .replace("f", "\f")
        .replace("n", "\n")
        .replace("r", "\r")
        .replace("t", "\t")
        .replace("v", "\x0B") // IE does not recognize "\v".
    }

NonEscapeCharacter
  = (!EscapeCharacter / LineTerminator) char_:SourceCharacter { return char_; }

EscapeCharacter
  = SingleEscapeCharacter
  / DecimalDigit
  / "x"
  / "u"

HexEscapeSequence
  = "x" digits:(HexDigit HexDigit) {
      return String.fromCharCode(parseInt("0x" + digits));
    }

UnicodeEscapeSequence
  = "u" digits:(HexDigit HexDigit HexDigit HexDigit) {
      return String.fromCharCode(parseInt("0x" + digits));
    }

/* Tokens */

BreakToken      = "break"            !IdentifierPart
CaseToken       = "case"             !IdentifierPart
CatchToken      = "catch"            !IdentifierPart
ContinueToken   = "continue"         !IdentifierPart
DebuggerToken   = "debugger"         !IdentifierPart
DefaultToken    = "default"          !IdentifierPart
DeleteToken     = "delete"           !IdentifierPart { return "delete"; }
DoToken         = "do"               !IdentifierPart
ElseToken       = "else"             !IdentifierPart
FalseToken      = "false"            !IdentifierPart
FinallyToken    = "finally"          !IdentifierPart
ForToken        = "for"              !IdentifierPart
FunctionToken   = "function"         !IdentifierPart
GetToken        = "get"              !IdentifierPart
IfToken         = "if"               !IdentifierPart
InstanceofToken = "instanceof"       !IdentifierPart { return "instanceof"; }
InToken         = "in"               !IdentifierPart { return "in"; }
NewToken        = "new"              !IdentifierPart
NullToken       = "null"             !IdentifierPart
ReturnToken     = "return"           !IdentifierPart
SetToken        = "set"              !IdentifierPart
SwitchToken     = "switch"           !IdentifierPart
ThisToken       = "this"             !IdentifierPart
ThrowToken      = "throw"            !IdentifierPart
TrueToken       = "true"             !IdentifierPart
TryToken        = "try"              !IdentifierPart
TypeofToken     = "typeof"           !IdentifierPart { return "typeof"; }
VarToken        = "var"              !IdentifierPart
VoidToken       = "void"             !IdentifierPart { return "void"; }
WhileToken      = "while"            !IdentifierPart
WithToken       = "with"             !IdentifierPart

/* Automatic Semicolon Insertion */

EOS
  = __ ";"
  / _ LineTerminatorSequence
  / _ &"}"
  / __ EOF

EOSNoLineTerminator
  = _ ";"
  / _ LineTerminatorSequence
  / _ &"}"
  / _ EOF

EOF
  = !.

/* Whitespace */

_
  = (WhiteSpace / MultiLineCommentNoLineTerminator / SingleLineComment)*

__
  = (WhiteSpace / LineTerminatorSequence / Comment)*

/* ===== A.2 Number Conversions ===== */

/*
 * Rules from this section are either unused or merged into previous section of
 * the grammar.
 */

/* ===== A.3 Expressions ===== */

PrimaryExpression
  = name:Identifier { 
  		return AST.identifier(name, {line:line, column:column});
  		//return { type: "Variable", name: name }; 
  	}
  / Literal
  / ArrayLiteral
  / "(" __ expression:Expression __ ")" { return expression; }

ArrayLiteral
  = "[" __ elision:(Elision __)? "]" {
  		return AST.literal(elision !== null ? elision[0] : [], "ArrayLiteral", {line:line, column:column});
      /*
      return {
        type:     "ArrayLiteral",
        elements: elision !== null ? elision[0] : []
      };
      */
    }
  / "[" __ elements:ElementList __ elision:("," __ (Elision __)?)? "]" {
  		var elts = elements.concat((elision !== null && elision.length && elision[2] !== null) ? elision[2][0] : []);
  		return AST.literal(elts, "ArrayLiteral", {line:line, column:column});
  		/*
      return {
        type:     "ArrayLiteral",
        elements: elements.concat((elision !== null && elision.length && elision[2] !== null) ? elision[2][0] : [])
      };
      */
    }

ElementList
  = head:(
      elision:(Elision __)? element:AssignmentExpression {
      	return (elision !== null && elision.length ? elision[0] : []).concat(element);
      }
    )
    tail:(
      __ "," __ elision:(Elision __)? element:AssignmentExpression {
      	return (elision !== null && elision.length ? elision[0] : []).concat(element);
      }
    )* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = result.concat(tail[i]);
      }
      return result;
    }

Elision
  = "," elision:(__ ",")* {
  		var result = [null];
      for (var i = 0; i < elision.length; i++) {
        result.push(null);
      }
      return result;
    }

MemberExpression
  = base:(
        PrimaryExpression
      / FunctionExpression
    )
    accessors:(
        __ "[" __ name:Expression __ "]" { return name; }
      / __ "." __ name:IdentifierName    { return name; }
    )* {
      var result = base;
      for (var i = 0; i < accessors.length; i++) {
      	result = AST.memberExpression(result, accessors[i], {line:line, column:column});
      	/*
        result = {
          type: "PropertyAccess",
          base: result,
          name: accessors[i]
        };
        */
      }
      return result;
    }

NewExpression
  = MemberExpression
  /*
  / NewToken __ constructor:NewExpression {
      return {
        type:        "NewOperator",
        constructor: constructor,
        arguments:   []
      };
    }
    */

CallExpression
  = base:(
      name:MemberExpression __ args:Arguments {
      	return AST.callExpression(name, args, {line:line, column:column});
      	/*
        return {
          type:      "FunctionCall",
          name:      name,
          arguments: args
        };
        */
      }
    )
    argumentsOrAccessors:(
        __ args:Arguments {
          return {
            type:      "FunctionCallArguments",
            arguments: args
          };
        }
      / __ "[" __ name:Expression __ "]" {
          return {
            type: "PropertyAccessProperty",
            name: name
          };
        }
      / __ "." __ name:IdentifierName {
          return {
            type: "PropertyAccessProperty",
            name: name
          };
        }
    )* {
      var result = base;
      for (var i = 0; i < argumentsOrAccessors.length; i++) {
        switch (argumentsOrAccessors[i].type) {
          case "FunctionCallArguments":
          	result = AST.callExpression(result, argumentsOrAccessors[i].arguments, {line:line, column:column});
          	/*
            result = {
              type:      "FunctionCall",
              name:      result,
              arguments: argumentsOrAccessors[i].arguments
            };
            */
            break;
          case "PropertyAccessProperty":
          	result = AST.memberExpression(result, argumentsOrAccessors[i].name, {line:line, column:column});
          	/*
            result = {
              type: "PropertyAccess",
              base: result,
              name: argumentsOrAccessors[i].name
            };
            */
            break;
          default:
            throw new Error(
              "Invalid expression type: " + argumentsOrAccessors[i].type
            );
        }
      }
      return result;
    }

Arguments
  = "(" __ args:ArgumentList? __ ")" {
    return args !== null ? args : [];
  }

ArgumentList
  = head:AssignmentExpression tail:(__ "," __ AssignmentExpression)* {
    var result = [head];
    for (var i = 0; i < tail.length; i++) {
      result.push(tail[i][3]);
    }
    return result;
  }

LeftHandSideExpression
  = CallExpression
  / NewExpression

PostfixExpression
  = expression:LeftHandSideExpression _ operator:PostfixOperator {
  		return AST.updateExpression(operator, expression, false, {line:line, column:column});
  		/*
      return {
        type:       "PostfixExpression",
        operator:   operator,
        expression: expression
      };
      */
    }
  / LeftHandSideExpression

PostfixOperator
  = "++"
  / "--"

UnaryExpression
  = PostfixExpression
  / operator:UnaryOperator __ expression:UnaryExpression {
  		if (operator === "++" || operator === "--") {
  			return AST.updateExpression(operator, expression, true, {line:line, column:column});
  		}
  		else {
  			return AST.unaryExpression(operator, expression, true, {line:line, column:column});
  		}
  		/*
      return {
        type:       "UnaryExpression",
        operator:   operator,
        expression: expression
      };
      */
    }

UnaryOperator
  = "++"
  / "--"
  / "+"
  / "-"
  / "~"
  /  "!"

MultiplicativeExpression
  = head:UnaryExpression
    tail:(__ MultiplicativeOperator __ UnaryExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

MultiplicativeOperator
  = operator:("*" / "/" / "%") !"=" { return operator; }

AdditiveExpression
  = head:MultiplicativeExpression
    tail:(__ AdditiveOperator __ MultiplicativeExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

AdditiveOperator
  = "+" !("+" / "=") { return "+"; }
  / "-" !("-" / "=") { return "-"; }

ShiftExpression
  = head:AdditiveExpression
    tail:(__ ShiftOperator __ AdditiveExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

ShiftOperator
  = "<<"
  / ">>>"
  / ">>"

RelationalExpression
  = head:ShiftExpression
    tail:(__ RelationalOperator __ ShiftExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

RelationalOperator
  = "<="
  / ">="
  / "<"
  / ">"

RelationalExpressionNoIn
  = head:ShiftExpression
    tail:(__ RelationalOperatorNoIn __ ShiftExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

RelationalOperatorNoIn
  = "<="
  / ">="
  / "<"
  / ">"

EqualityExpression
  = head:RelationalExpression
    tail:(__ EqualityOperator __ RelationalExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

EqualityExpressionNoIn
  = head:RelationalExpressionNoIn
    tail:(__ EqualityOperator __ RelationalExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

EqualityOperator
  = "==="
  / "!=="
  / "=="
  / "!="

BitwiseANDExpression
  = head:EqualityExpression
    tail:(__ BitwiseANDOperator __ EqualityExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

BitwiseANDExpressionNoIn
  = head:EqualityExpressionNoIn
    tail:(__ BitwiseANDOperator __ EqualityExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

BitwiseANDOperator
  = "&" !("&" / "=") { return "&"; }

BitwiseXORExpression
  = head:BitwiseANDExpression
    tail:(__ BitwiseXOROperator __ BitwiseANDExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

BitwiseXORExpressionNoIn
  = head:BitwiseANDExpressionNoIn
    tail:(__ BitwiseXOROperator __ BitwiseANDExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

BitwiseXOROperator
  = "^" !("^" / "=") { return "^"; }

BitwiseORExpression
  = head:BitwiseXORExpression
    tail:(__ BitwiseOROperator __ BitwiseXORExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

BitwiseORExpressionNoIn
  = head:BitwiseXORExpressionNoIn
    tail:(__ BitwiseOROperator __ BitwiseXORExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

BitwiseOROperator
  = "|" !("|" / "=") { return "|"; }

LogicalANDExpression
  = head:BitwiseORExpression
    tail:(__ LogicalANDOperator __ BitwiseORExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

LogicalANDExpressionNoIn
  = head:BitwiseORExpressionNoIn
    tail:(__ LogicalANDOperator __ BitwiseORExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

LogicalANDOperator
  = "&&" !"=" { return "&&"; }

LogicalORExpression
  = head:LogicalANDExpression
    tail:(__ LogicalOROperator __ LogicalANDExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

LogicalORExpressionNoIn
  = head:LogicalANDExpressionNoIn
    tail:(__ LogicalOROperator __ LogicalANDExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

LogicalOROperator
  = "||" !"=" { return "||"; }

ConditionalExpression
  = condition:LogicalORExpression __
    "?" __ trueExpression:AssignmentExpression __
    ":" __ falseExpression:AssignmentExpression {
    	return AST.conditionalExpression(condition, trueExpression, falseExpression, {line:line, column:column});
    	/*
      return {
        type:            "ConditionalExpression",
        condition:       condition,
        trueExpression:  trueExpression,
        falseExpression: falseExpression
      };
      */
    }
  / LogicalORExpression

ConditionalExpressionNoIn
  = condition:LogicalORExpressionNoIn __
    "?" __ trueExpression:AssignmentExpressionNoIn __
    ":" __ falseExpression:AssignmentExpressionNoIn {
    	return AST.conditionalExpression(condition, trueExpression, falseExpression, {line:line, column:column});
    	/*
      return {
        type:            "ConditionalExpression",
        condition:       condition,
        trueExpression:  trueExpression,
        falseExpression: falseExpression
      };
      */
    }
  / LogicalORExpressionNoIn

AssignmentExpression
  = left:LeftHandSideExpression __
    operator:AssignmentOperator __
    right:AssignmentExpression {
    	return AST.assignmentExpression(operator, left, right, {line:line, column:column});
    	/*
      return {
        type:     "AssignmentExpression",
        operator: operator,
        left:     left,
        right:    right
      };
      */
    }
  / ConditionalExpression

AssignmentExpressionNoIn
  = left:LeftHandSideExpression __
    operator:AssignmentOperator __
    right:AssignmentExpressionNoIn {
    	return AST.assignmentExpression(operator, left, right, {line:line, column:column});
    	/*
      return {
        type:     "AssignmentExpression",
        operator: operator,
        left:     left,
        right:    right
      };
      */
    }
  / ConditionalExpressionNoIn

AssignmentOperator
  = "=" (!"=") { return "="; }
  / "*="
  / "/="
  / "%="
  / "+="
  / "-="
  / "<<="
  / ">>="
  / ">>>="
  / "&="
  / "^="
  / "|="

Expression
  = head:AssignmentExpression
    tail:(__ "," __ AssignmentExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        	result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
        	/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

ExpressionNoIn
  = head:AssignmentExpressionNoIn
    tail:(__ "," __ AssignmentExpressionNoIn)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
      		result = AST.binaryExpression(tail[i][1], result, tail[i][3], {line:line, column:column});
      		/*
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
        */
      }
      return result;
    }

/* ===== A.4 Statements ===== */

/*
 * The specification does not consider |FunctionDeclaration| and
 * |FunctionExpression| as statements, but JavaScript implementations do and so
 * are we. This syntax is actually used in the wild (e.g. by jQuery).
 */
Statement
  = Block
  / VariableStatement
  / EmptyStatement
  / ExpressionStatement
  / IfStatement
  / IterationStatement
  / ContinueStatement
  / BreakStatement
  / ReturnStatement
  / LabelledStatement
  / SwitchStatement
  / FunctionDeclaration
  / FunctionExpression

Block
  = "{" __ statements:(StatementList __)? "}" {
      return {
        type:       "Block",
        statements: statements !== null ? statements[0] : []
      };
    }

StatementList
  = head:Statement tail:(__ Statement)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][1]);
      }
      return result;
    }

VariableStatement
  = type:(VarToken / TypeSpecifier) __ arrType:ArrayTypeSpecifier? __ declarations:VariableDeclarationList EOS {
      	return AST.variableDeclaration(type, arrType ? true:false, declarations, {line:line, column:column});
      	/*
      return {
        type:         "VariableStatement",
        varType: type,
        isArray: arrType ? true : false,
        declarations: declarations
      };
      */
    }

TypeSpecifier 
= "int"
/"char"
/"void"
/"string"
/"double"
/"bool"

VariableDeclarationList
  = head:VariableDeclaration tail:(__ "," __ VariableDeclaration)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) { 
        result.push(tail[i][3]);
      }
      return result;
    }

VariableDeclarationListNoIn
  = head:VariableDeclarationNoIn tail:(__ "," __ VariableDeclarationNoIn)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][3]);
      }
      return result;
    }

VariableDeclaration
  = name:Identifier value:(__ Initialiser)? {
  		return AST.variableDeclarator(name, value !== null ? value[1]:null, {line:line, column:column});
  		/*
      return {
        type:  "VariableDeclaration",
        name:  name,
        value: value !== null ? value[1] : null
      };
      */
    }

VariableDeclarationNoIn
  = name:Identifier value:(__ InitialiserNoIn)? {
  		return AST.variableDeclarator(name, value !== null ? value[1]:null, {line:line, column:column});
  		/*
      return {
        type:  "VariableDeclaration",
        name:  name,
        value: value !== null ? value[1] : null
      };
      */
    }

Initialiser
  = "=" (!"=") __ expression:AssignmentExpression { return expression; }

InitialiserNoIn
  = "=" (!"=") __ expression:AssignmentExpressionNoIn { return expression; }

EmptyStatement
  = ";" { 
  	return AST.emptyStatement({line:line, column:column});
  	//return { type: "EmptyStatement" }; 
  }

ExpressionStatement
  = !("{" / FunctionToken) expression:Expression EOS { return expression; }

IfStatement
  = IfToken __
    "(" __ condition:Expression __ ")" __
    ifStatement:Statement
    elseStatement:(__ ElseToken __ Statement)? {
    	return AST.ifStatement(condition, ifStatement, elseStatement !== null ? elseStatement[3]:null, {line:line, column:column});
    	/*
      return {
        type:          "IfStatement",
        condition:     condition,
        ifStatement:   ifStatement,
        elseStatement: elseStatement !== null ? elseStatement[3] : null
      };
      */
    }

IterationStatement
  = DoWhileStatement
  / WhileStatement
  / ForStatement

DoWhileStatement
  = DoToken __
    statement:Statement __
    WhileToken __ "(" __ condition:Expression __ ")" EOS {
    	return AST.doWhileStatement(statement, condition, {line:line, column:column});
    	/*
      return {
        type: "DoWhileStatement",
        condition: condition,
        statement: statement
      };
      */
    }

WhileStatement
  = WhileToken __ "(" __ condition:Expression __ ")" __ statement:Statement {
  		return AST.whileStatement(condition, statement, {line:line, column:column});
  		/*
      return {
        type: "WhileStatement",
        condition: condition,
        statement: statement
      };
      */
    }

ForStatement
  = ForToken __
    "(" __
    initializer:(
        type:(VarToken/TypeSpecifier) __ declarations:VariableDeclarationListNoIn {
        	return AST.variableDeclaration(type, false, declarations, {line:line, column:column});
        	/*
          return {
            type:         "VariableStatement",
            declarations: declarations
          };
          */
        }
      / ExpressionNoIn?
    ) __
    ";" __
    test:Expression? __
    ";" __
    counter:Expression? __
    ")" __
    statement:Statement
    {
    	return AST.forStatement(initializer, test, counter, statement, {line:line, column:column});
    	/*
      return {
        type:        "ForStatement",
        initializer: initializer,
        test:        test,
        counter:     counter,
        statement:   statement
      };
      */
    }

ContinueStatement
  = ContinueToken _
    label:(
        identifier:Identifier EOS { return identifier; }
      / EOSNoLineTerminator       { return "";         }
    ) {
    	return AST.continueStatement({line:line, column:column});
    	/*
      return {
        type:  "ContinueStatement",
        label: label !== "" ? label : null
      };
      */
    }

BreakStatement
  = BreakToken _
    label:(
        identifier:Identifier EOS { return identifier; }
      / EOSNoLineTerminator       { return ""; }
    ) {
    	return AST.breakStatement({line:line, column:column});
    	/*
      return {
        type:  "BreakStatement",
        label: label !== "" ? label : null
      };
      */
    }

ReturnStatement
  = ReturnToken _
    value:(
        expression:Expression EOS { return expression; }
      / EOSNoLineTerminator       { return ""; }
    ) {
    	return AST.returnStatement(value !== "" ? value : null, {line:line, column:column});
    	/*
      return {
        type:  "ReturnStatement",
        value: value !== "" ? value : null
      };
      */
    }

SwitchStatement
  = SwitchToken __ "(" __ expression:Expression __ ")" __ clauses:CaseBlock {
  		return AST.switchStatement(expression, clauses, {line:line, column:column});
  		/*
      return {
        type:       "SwitchStatement",
        expression: expression,
        clauses:    clauses
      };
      */
    }

CaseBlock
  = "{" __
    before:CaseClauses?
    defaultAndAfter:(__ DefaultClause __ CaseClauses?)? __
    "}" {
      var before = before !== null ? before : [];
      if (defaultAndAfter !== null) {
        var defaultClause = defaultAndAfter[1];
        var clausesAfter = defaultAndAfter[3] !== null
          ? defaultAndAfter[3]
          : [];
      } else {
        var defaultClause = null;
        var clausesAfter = [];
      }

      return (defaultClause ? before.concat(defaultClause) : before).concat(clausesAfter);
    }

CaseClauses
  = head:CaseClause tail:(__ CaseClause)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][1]);
      }
      return result;
    }

CaseClause
  = CaseToken __ selector:Expression __ ":" statements:(__ StatementList)? {
  		return AST.switchCase(selector, statements, {line:line, column:column});
  		/*
      return {
        type:       "CaseClause",
        selector:   selector,
        statements: statements !== null ? statements[1] : []
      };
      */
    }

DefaultClause
  = DefaultToken __ ":" statements:(__ StatementList)? {
  		return AST.switchCase(null, statements, {line:line, column:column});
  		/*
      return {
        type:       "DefaultClause",
        statements: statements !== null ? statements[1] : []
      };
      */
    }

LabelledStatement
  = label:Identifier __ ":" __ statement:Statement {
  		return AST.labeledStatement(label, statement, {line:line, column:column});
  		/*
      return {
        type:      "LabelledStatement",
        label:     label,
        statement: statement
      };
      */
    }

/* ===== A.5 Functions and Programs ===== */

FunctionDeclaration
  = retType:(FunctionToken/TypeSpecifier) __ name:Identifier __
    "(" __ params:FormalParameterList? __ ")" __
    "{" __ elements:FunctionBody __ "}" {
    	return AST.functionDeclaration(retType, name, params !== null ? params : [], elements, {line:line, column:column});
    	/*
      return {
        type:     "Function",
        retType: retType,
        name:     name,
        params:   params !== null ? params : [],
        elements: elements
      };
      */
    }

FunctionExpression
  = retType:(FunctionToken/TypeSpecifier) __ name:Identifier? __
    "(" __ params:FormalParameterList? __ ")" __
    "{" __ elements:FunctionBody __ "}" {
    	return AST.functionDeclaration(retType, name, params !== null ? params : [], elements, {line:line, column:column});
    	/*
      return {
        type:     "Function",
        retType: retType,
        name:     name,
        params:   params !== null ? params : [],
        elements: elements
      };
      */
    }

FormalParameterList
  = headType:TypeSpecifier __ arrSpec:ArrayTypeSpecifier? __ head:Identifier 
    tail:(__ "," __ TypeSpecifier __ ArrayTypeSpecifier? __ Identifier)* {
      /*
      var result = [{
         type: headType,
         name: head,
         isArray: arrSpec  ? true : false,
      }];
      */
      var declarator = AST.variableDeclarator(head, null, {line:line, column:column});
      var result = [AST.variableDeclaration(headType, arrSpec ? true:false, [declarator], {line:line, column:column})];

      for (var i = 0; i < tail.length; i++) {
      	var tailDeclarator = AST.variableDeclarator(tail[i][7], null, {line:line, column:column});
      	result.push(AST.variableDeclaration(tail[i][3], tail[i][5] ? true:false, [tailDeclarator], {line:line, column:column}));
        /*
        result.push({
        	type:tail[i][3], 
        	name:tail[i][7], 
        	isArray: tail[i][5] ? true : false,
        });
		*/
      }
      return result;
    }

ArrayTypeSpecifier
	= "[" __ "]" { return true; }

FunctionBody
  = elements:SourceElements? { return elements !== null ? elements : []; }

Program
  = elements:SourceElements? {
  		return AST.program(elements !== null ? elements : [], {line:line, column:column});
  		/*
      return {
        type:     "Program",
        elements: elements !== null ? elements : []
      };
      */
    }

SourceElements
  = head:SourceElement tail:(__ SourceElement)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][1]);
      }
      return result;
    }

/*
 * The specification also allows |FunctionDeclaration| here. We do it
 * implicitly, because we consider |FunctionDeclaration| and
 * |FunctionExpression| as statements. See the comment at the |Statement| rule.
 */
SourceElement
  = Statement
