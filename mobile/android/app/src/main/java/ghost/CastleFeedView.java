package ghost;

import android.graphics.Color;
import android.util.Log;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

import androidx.annotation.NonNull;

public class CastleFeedView extends SimpleViewManager<ViewGroup> {
    @NonNull
    @Override
    public String getName() {
        return "CastleFeedView";
    }

    @NonNull
    @Override
    protected ViewGroup createViewInstance(@NonNull ThemedReactContext reactContext) {
        ViewGroup v = new FrameLayout(reactContext);
        v.setBackgroundColor(Color.RED);
        return v;
    }

    @ReactProp(name = "decks")
    public void setDecks(ViewGroup view, @Nullable ReadableArray decks) {
        Log.d("TAG", "blah");
    }
}
