package xyz.castle.api;// Copyright 2015-present 650 Industries. All rights reserved.

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class GraphQLOperation {

    private static class Variable {
        String name;
        String type;
        String stringValue;
        Integer integerValue;
        Float floatValue;
    }

    static class Field {
        String fieldName;
        List<Field> subfields;

        Field(String fieldName) {
            this.fieldName = fieldName;
        }

        String serialize() {
            if (subfields == null || subfields.size() == 0) {
                return fieldName;
            } else {
                String result = fieldName + " {\n";

                for (int i = 0; i < subfields.size(); i++) {
                    result += subfields.get(i).serialize() + "\n";
                }

                return result + "}";
            }
        }
    }

    String type;
    String name;
    List<Variable> variables = new ArrayList<>();
    List<Field> fields = new ArrayList<>();

    private GraphQLOperation() {

    }

    public String build() throws JSONException {
        String query = type + " MainQuery(";

        for (int i = 0; i < variables.size(); i++) {
            query += "$" + variables.get(i).name + ": " + variables.get(i).type;

            if (i < variables.size() - 1) {
                query += ", ";
            }
        }

        query += ") {\n" + name + "(";

        for (int i = 0; i < variables.size(); i++) {
            String name = variables.get(i).name;
            query += name + ": $" + name;

            if (i < variables.size() - 1) {
                query += ", ";
            }
        }

        query += ") {\n";

        for (int i = 0; i < fields.size(); i++) {
            query += fields.get(i).serialize() + "\n";
        }

        query += "}\n}";

        JSONObject variablesJson = new JSONObject();
        for (int i = 0; i < variables.size(); i++) {
            Variable v = variables.get(i);

            if (v.floatValue != null) {
                variablesJson.put(v.name, (float) v.floatValue);
            } else if (v.integerValue != null) {
                variablesJson.put(v.name, (int) v.integerValue);
            } else {
                variablesJson.put(v.name, v.stringValue);
            }
        }

        JSONObject json = new JSONObject();
        json.put("query", query);
        json.put("variables", variablesJson);

        return json.toString();
    }

    public static GraphQLOperation Query(String name) {
        GraphQLOperation op = new GraphQLOperation();
        op.type = "query";
        op.name = name;
        return op;
    }

    public static GraphQLOperation Mutation(String name) {
        GraphQLOperation op = new GraphQLOperation();
        op.type = "mutation";
        op.name = name;
        return op;
    }

    public GraphQLOperation field(String name) {
        fields.add(new Field(name));
        return this;
    }

    public GraphQLOperation field(String name, FieldList fieldList) {
        Field f = new Field(name);
        f.subfields = fieldList.fields;
        fields.add(f);
        return this;
    }

    public GraphQLOperation fields(FieldList fieldList) {
        for (int i = 0; i < fieldList.fields.size(); i++) {
            fields.add(fieldList.fields.get(i));
        }

        return this;
    }

    public GraphQLOperation variable(String name, String type, String value) {
        Variable v = new Variable();
        v.name = name;
        v.type = type;
        v.stringValue = value;
        variables.add(v);
        return this;
    }

    public GraphQLOperation variable(String name, String type, Integer value) {
        Variable v = new Variable();
        v.name = name;
        v.type = type;
        v.integerValue = value;
        variables.add(v);
        return this;
    }

    public GraphQLOperation variable(String name, String type, Float value) {
        Variable v = new Variable();
        v.name = name;
        v.type = type;
        v.floatValue = value;
        variables.add(v);
        return this;
    }
}
