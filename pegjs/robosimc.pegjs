/*
 * RoboSimC
 * A simplified C-style language for RoboSim
*/

Program = tu:TranslationUnit { return tu; }

//=========================================
// External Definitions
//=========================================

TranslationUnit
	= Spacing ed:ExternalDeclaration+ EOT {
		return ed;
	}

ExternalDeclaration /* At some point, we should return something with an AST */
	= func:FunctionDefinition { return { type: 'function', data: func }; } 
	/ decl:Declaration { return { type: 'declaration', data: decl }; }

FunctionDefinition
	= spec:DeclarationSpecifiers decl:Declarator list:DeclarationList? stat:CompoundStatement {
		return {
			specifiers: spec,
			declarator: decl,
			declarationList: list,
			statement: stat
		};
	};

DeclarationList 
	= Declaration+

//=========================================
// Declarations
//=========================================

Declaration 
	= spec:DeclarationSpecifiers init:InitDeclaratorList? SEMI {
		var r = {
			specifiers: spec
		};
		if (init) r['initList'] = init;
		return r;
	};

DeclarationSpecifiers
	= ( type:TypedefName
		{
			return type;
		})
	/ ( TypeSpecifier )+

InitDeclaratorList
	= head:InitDeclarator tail:(COMMA it:InitDeclarator { return it; } )* {
		return [head].concat(tail); 
	}

InitDeclarator
	= dec:Declarator init:(EQU init:Initializer { return init;} )? {
		if (init)
			dec.initializer = init;
		return dec;
	}

/* Note, this is simplified from C, and has the added String type */
TypeSpecifier
	= ts:(VOID
	/ CHAR
	/ INT
	/ DOUBLE
	/ BOOL
	/ COMPLEX /* ??? */
	/ STRING /* NOT C Standard! */
	) {
		return {
			type: 'TypeSpecifier',
			value: ts
		}
	}

SpecifierQualifierList
	= ( type:TypedefName ) 
	  {
		return type;
	  }
	/ ( TypeSpecifier )+

Declarator
	= dec:DirectDeclarator { return dec; }

DirectDeclarator
	= what:( name:Identifier { return { type: 'Identifier', name: name}; }
		/ LPAR dec:Declarator RPAR { return { type: 'Declarator', value: dec}; })
	  how:(
	  	LBRK exp:AssignmentExpression? RBRK { return {type:'array', dim:exp }; }
	  / LPAR par:ParameterTypeList RPAR { return {type: 'params', params:par}; }
	  / LPAR par:IdentifierList? RPAR { return {type: 'idents', params:par}; }
	  )* {
	  	var r = what;
	  	if (how.length) r.how = how;
	  	return r;
	  }	

ParameterTypeList
	= params:ParameterList varlist:(COMMA ELLIPSIS)? {
		if (varlist) params.variable = true;
		return params; /*Do we really need the varlist? */
	}

ParameterList 
	= head:ParameterDeclaration tail:(COMMA p:ParameterDeclaration { return p; } )* {
		var r = [head];
		if (tail) r = r.concat(tail);
		return r;
	}

ParameterDeclaration
	= decs:DeclarationSpecifiers
	  dec:( Declarator / AbstractDeclarator )? {
	  	if (dec) decs.push(dec);
	  	return decs;
	  }

IdentifierList
	= header:Identifier tail:(COMMA Identifier)* {
		var r = [head];
		if (tail) r = r.concat(tail);
		return r;
	}

TypeName
	= SpecifierQualifierList AbstractDeclarator?

AbstractDeclarator
	= DirectAbstractDeclarator

DirectAbstractDeclarator
	= ( LPAR AbstractDeclarator RPAR
	  / LBRK AssignmentExpression? RBRK
	  / LPAR ParameterTypeList? RPAR
	  )
	  ( LBRK AssignmentExpression? RBRK
	  / LPAR ParameterTypeList? RPAR
	  )*

TypedefName
	= id:Identifier { return {type: 'userTypesSpecifier', value: id}; }

Initializer
	= AssignmentExpression
	/ LWING InitializerList COMMA? RWING

InitializerList
	= Designation? Initializer (COMMA Designation? Initializer)*

Designation
	= Designator+ EQU

Designator
	= LBRK ConstantExpression RBRK
	/ DOT Identifier


//=====================================
// Statements
//=====================================

Statement
	= LabeledStatement
	/ CompoundStatement
	/ ExpressionStatement
	/ SelectionStatement
	/ IterationStatement
	/ JumpStatement 

LabeledStatement
	= Identifier COLON Statement
	/ CASE ConstantExpression COLON Statement
	/ DEFAULT COLON Statement

CompoundStatement
	= LWING ( Declaration / Statement )* RWING

ExpressionStatement
	= Expression? SEMI

SelectionStatement
	= IF LPAR Expression RPAR Statement (ELSE Statement)?
	/ SWITCH LPAR Expression RPAR Statement

IterationStatement
	= WHILE LPAR Expression RPAR Statement
	/ DO Statement WHILE LPAR Expression RPAR SEMI
	/ FOR LPAR Expression? SEMI Expression? SEMI Expression? RPAR Statement
	/ FOR LPAR Declaration Expression? SEMI Expression RPAR Statement

JumpStatement
	= CONTINUE SEMI
	/ BREAK SEMI
	/ RETURN Expression? SEMI


//======================================
// Expressions
//======================================

PrimaryExpression
	= Identifier
	/ Constant
	/ sl:StringLiteral { return sl; }
	/ LPAR Expression RPAR

PostfixExpression
	= pri:( PrimaryExpression
	  / LPAR TypeName RPAR LWING InitializerList COMMA? RWING
	  )
	  tail:( LBRK Expression RBRK
	  / LPAR ArgumentExpressionList? RPAR
	  / DOT Identifier
	  / INC
	  / DEC
	  )* {
	  	return {
	  		type: "PostFixExpression",
	  		primary: pri,
	  		tail: tail
	  	};
	}

ArgumentExpressionList
	= AssignmentExpression (COMMA AssignmentExpression)*

UnaryExpression
	= PostfixExpression
	/ INC UnaryExpression
	/ DEC UnaryExpression
	/ UnaryOperator CastExpression

UnaryOperator
	= AND
	/ PLUS
	/ MINUS
	/ TILDE
	/ BANG

CastExpression
	= (LPAR TypeName RPAR)* UnaryExpression

MultiplicativeExpression
	= CastExpression ((STAR / DIV / MOD) CastExpression)*

AdditiveExpression
	= MultiplicativeExpression ((PLUS / MINUS) MultiplicativeExpression)*

ShiftExpression
	= AdditiveExpression ((LEFT / RIGHT) AdditiveExpression)*

RelationalExpression
	= ShiftExpression ((LE / GE / LT / GT) ShiftExpression)*

EqualityExpression
	= RelationalExpression ((EQUEQU / BANGEQU) RelationalExpression)*

ANDExpression
	= EqualityExpression (AND EqualityExpression)*

ExclusiveORExpression
	= ANDExpression (HAT ANDExpression)*

InclusiveORExpression
	= ExclusiveORExpression (OR ExclusiveORExpression)*

LogicalANDExpression
	= InclusiveORExpression (ANDAND InclusiveORExpression)*

LogicalORExpression
	= LogicalANDExpression (OROR LogicalANDExpression)*

ConditionalExpression
	= LogicalORExpression (QUERY Expression COLON LogicalORExpression)*

AssignmentExpression
	= UnaryExpression AssignmentOperator AssignmentExpression
	/ ConditionalExpression

AssignmentOperator
	= EQU
	/ STAREQU
	/ DIVEQU
	/ MODEQU
	/ PLUSEQU
	/ MINUSEQU
	/ LEFTEQU
	/ RIGHTEQU
	/ ANDEQU
	/ HATEQU
	/ OREQU

Expression 
	= AssignmentExpression (COMMA AssignmentExpression)*

ConstantExpression
	= ConditionalExpression


//======================================================
// Lexical Elements
// Tokens are: Keyword, Identifier, Constant, StringLiteral, Punctuator
// Tokens separated by spacing
//======================================================

Spacing
	= ( WhiteSpace
	  / LongComment
	  / LineComment
	  )*

WhiteSpace = [ \n\r\t\u000B\u000c]

LongComment
	= "/*" (!"*/" .)* "*/"

LineComment
	= "//" (!"\n" .)*


//======================================================
// Keywords
//======================================================

BREAK		= n:"break"		!IdChar Spacing { return n; }
CASE 		= n:"case"		!IdChar Spacing { return n; }
CHAR 		= n:"char"		!IdChar Spacing { return n; }
CONTINUE	= n:"continue"	!IdChar Spacing { return n; }
DEFAULT		= n:"default"	!IdChar Spacing { return n; }
DOUBLE		= n:"double"	!IdChar Spacing { return n; }
DO 			= n:"do"		!IdChar Spacing { return n; }
ELSE 		= n:"else"		!IdChar Spacing { return n; }
FOR 		= n:"for"		!IdChar Spacing { return n; }
IF 			= n:"if"		!IdChar Spacing { return n; }
INT 		= n:"int"		!IdChar Spacing { return n; }
RETURN 		= n:"return"	!IdChar Spacing { return n; }
STRING 		= n:"String"	!IdChar Spacing { return n; }
SWITCH		= n:"switch"	!IdChar Spacing { return n; }
VOID		= n:"void"		!IdChar Spacing { return n; }
WHILE		= n:"while"		!IdChar Spacing { return n; }
BOOL		= n:"boolean"	!IdChar Spacing { return n; }
COMPLEX		= n:"_Complex"	!IdChar Spacing { return n; }

Keyword 
	= ( "break"
	  / "case"
	  / "char"
	  / "continue"
	  / "default"
	  / "double"
	  / "do"
	  / "else"
	  / "for"
	  / "if"
	  / "int"
	  / "return"
	  / "String"
	  / "switch"
	  / "void"
	  / "while"
	  / "boolean"
	  / "_Complex")
	  !IdChar

//===============================================
// Identifiers
//===============================================

Identifier
	= !Keyword first:IdNondigit chars:IdChar* Spacing {
		var id = [first];
		id = id.concat(chars);
		return id.join("");
	}

IdNondigit
	= [a-z] / [A-Z] / [_]
	/ UniversalCharacter

IdChar
	= [a-z] / [A-Z] / [0-9] / [_]
	/ UniversalCharacter


//===============================================
// Universal Character Names
//===============================================

UniversalCharacter
	= "\\u" HexQuad
	/ "\\U" HexQuad HexQuad

HexQuad = HexDigit HexDigit HexDigit HexDigit


//==============================================
// Constants
//==============================================

Constant
	= FloatConstant
	/ IntegerConstant
	/ CharacterConstant

IntegerConstant
	= ( DecimalConstant
	  / HexConstant
	  / OctalConstant
	  )
	Spacing

DecimalConstant = [1-9][0-9]*

OctalConstant = "0"[0-7]*

HexConstant = HexPrefix HexDigit*

HexPrefix = "0x" / "0X"

HexDigit = [a-f] / [A-F] / [0-9]

FloatConstant
	= ( DecimalFloatConstant
	  / HexFloatConstant
	  )
	  Spacing

DecimalFloatConstant
	= Fraction Exponent?
	/ [0-9]+ Exponent

HexFloatConstant
	= HexPrefix HexFraction BinaryExponent?
	/ HexPrefix HexDigit+ BinaryExponent

Fraction
	= [0-9]* "." [0-9]+
	/ [0-9]+ "."

HexFraction
	= HexDigit* "." HexDigit
	/ HexDigit+ "."

Exponent = [eE][+\-]? [0-9]+

BinaryExponent = [pP][+\-]? [0-9]+

CharacterConstant = "L"? "'" Char* "'" Spacing

Char = Escape / !['\n\\] .

Escape
	= SimpleEscape
	/ OctalEscape
	/ HexEscape
	/ UniversalCharacter

SimpleEscape = "\\" ['\"?\\abfnrtv]
OctalEscape = "\\" [0-7][0-7]?[0-7]?
HexEscape = "\\x" HexDigit+


//======================================
// String Literals
//======================================

StringLiteral = "L"?(["] StringChar* ["] Spacing)+

StringChar = Escape / ![\"\n\\] .


//======================================
// Punctuators
//======================================

LBRK		= "["			Spacing
RBRK		= "]"			Spacing
LPAR		= "("			Spacing
RPAR		= ")"			Spacing
LWING		= "{"			Spacing
RWING		= "}"			Spacing
DOT 		= "."			Spacing
INC 		= "++"			Spacing
DEC 		= "--"			Spacing
AND 		= "&" ![&]		Spacing
STAR 		= "*" ![=]		Spacing
PLUS 		= "+" ![+=]		Spacing
MINUS 		= "-" ![\-=>]	Spacing
TILDE 		= "~"			Spacing
BANG 		= "!" ![=]		Spacing
DIV 		= "/" ![=]		Spacing
MOD 		= "%" ![=>]		Spacing
LEFT 		= "<<" ![=]		Spacing
RIGHT 		= ">>" ![=]		Spacing
LT 			= "<" ![=]		Spacing
GT			= ">" ![=]		Spacing
LE 			= "<="			Spacing
GE 			= ">="			Spacing
EQUEQU 		= "=="			Spacing
BANGEQU		= "!="			Spacing
HAT 		= "^" ![=]		Spacing
OR 			= "|" ![=]		Spacing
ANDAND 		= "&&"			Spacing
OROR 		= "||"			Spacing
QUERY		= "?"			Spacing
COLON 		= ":" ![>]		Spacing
SEMI 		= ";"			Spacing
ELLIPSIS 	= "..."			Spacing
EQU 		= "=" !"="		Spacing
STAREQU		= "*="			Spacing
DIVEQU		= "/="			Spacing
MODEQU		= "%="			Spacing
PLUSEQU		= "+="			Spacing
MINUSEQU	= "-="			Spacing
LEFTEQU		= "<<="			Spacing
RIGHTEQU	= ">>="			Spacing
ANDEQU		= "&="			Spacing
HATEQU		= "^="			Spacing
OREQU		= "|="			Spacing
COMMA		= ","			Spacing

EOT 		= !.