// Copyright 2015-present 650 Industries. All rights reserved.

package xyz.castle.api;

import java.util.ArrayList;
import java.util.List;

public class FieldList {
    List<GraphQLOperation.Field> fields = new ArrayList<>();

    public FieldList() {}

    public FieldList(String ...strings) {
        for (int i = 0; i < strings.length; i++) {
            fields.add(new GraphQLOperation.Field(strings[i]));
        }
    }

    public FieldList add(String field) {
        fields.add(new GraphQLOperation.Field(field));
        return this;
    }

    public FieldList add(String field, FieldList list) {
        GraphQLOperation.Field f = new GraphQLOperation.Field(field);
        f.subfields = list.fields;
        fields.add(f);
        return this;
    }
}
